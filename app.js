require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const schedule = require("node-schedule");
const Discord = require("discord.js");
const intents = new Discord.Intents(32767);
const client = new Discord.Client({ intents });
const createChart = require("./module/createChart.js");
const { DateTime } = require("luxon");

Number.prototype.comma = function () {
    return this.valueOf()
        .toString()
        .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
};

const diff = (a, b) => {
    return a - b >= 0 ? `+${(a - b).comma()}` : `-${(b - a).comma()}`;
};
let cacheData;
let todayData;
let yesterdayData;
const updateData = async (func = () => {}) => {
    console.log("Updating Data...");
    fs.readFile("./Data/data.json", "utf8", async (err, data) => {
        if (!data) {
            await fetchAPI();
            return;
        }
        cacheData = JSON.parse(data);
        todayData = cacheData[cacheData.length - 1];
        yesterdayData = cacheData[cacheData.length - 2];
        func();
    });
};

const fetchAPI = async () => {
    const rawData = await axios({
        method: "get",
        url: "https://covid19.ddc.moph.go.th/api/Cases/timeline-cases-all",
    });
    const data = await rawData.data;

    fs.writeFile("./Data/data.json", JSON.stringify(data.slice(-30)), (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Successfully update data.json");
        }
    });
    updateData(() => {
        console.log("updating chart...");
        createChart(cacheData, "case", "Data/case.png");
        createChart(cacheData, "death", "Data/death.png");
        createChart(cacheData, "recovered", "Data/recovered.png");
    });
};
console.log("Fetching Data...");
console.log("Updating Data...");
fetchAPI();

const messageToChannels = () => {
    fs.readFile("./Data/channel.json", "utf8", async (err, data) => {
        channelArr = JSON.parse(data);
        if (!channelArr) {
            return;
        }
        console.log(channelArr);
        channelArr.forEach((channelID) => {
            client.channels.cache
                .get(channelID)
                ?.send({ embeds: [covidEmbedMessage()] })
                .catch((err) =>
                    console.log(`${err.name}: ${err.message} on channel ID ${channelID}`)
                );
        });
    });
};

const dailyFetch = async (tryCount = 0) => {
    const today = DateTime.now().setZone("Asia/Bangkok").day;
    await fetchAPI();
    fs.readFile("./Data/data.json", "utf8", async (err, data) => {
        const cacheData = JSON.parse(data);
        const newestData = cacheData[cacheData.length - 1];
        const newestDate = Number(newestData.txn_date.split("-")[2]);
        if (newestDate == today || tryCount >= 5) {
            messageToChannels();
            return;
        }
        console.log("The data is not up-to-date, will fetch data again in next 1 hour");
        setTimeout(dailyFetch(tryCount + 1), 3600);
    });
};

let timerule = new schedule.RecurrenceRule();
// 8 am at bangkok
timerule.tz = "Asia/Bangkok";
timerule.second = 0;
timerule.minute = 0;
timerule.hour = 8;

// fectch data at 8 am everyday
schedule.scheduleJob(timerule, async () => {
    await dailyFetch();
});

let covidEmbedMessage = () =>
    new Discord.MessageEmbed()
        .setColor("#FFB247")
        .setTitle("Today Stat")
        .addFields(
            {
                name: "🤒 New Case",
                value: `${todayData.new_case.comma()} (${diff(
                    todayData.new_case,
                    yesterdayData.new_case
                )})`,
                inline: true,
            },
            {
                name: "😥 New Death",
                value: `${todayData.new_death.comma()} (${diff(
                    todayData.new_death,
                    yesterdayData.new_death
                )})`,
                inline: true,
            },
            {
                name: "😊 New Recovered",
                value: `${todayData.new_recovered.comma()} (${diff(
                    todayData.new_recovered,
                    yesterdayData.new_recovered
                )})`,
                inline: true,
            },
            { name: "\u200B", value: "\u200B" },
            { name: "🤒 Total Case", value: todayData.total_case.comma(), inline: true },
            { name: "😥 Total Death", value: todayData.total_death.comma(), inline: true },
            { name: "😊 Total Recovered", value: todayData.total_recovered.comma(), inline: true }
        )
        .setFooter(`Update Date: ${todayData.update_date}`);

client.on("ready", () => {
    console.log(
        "\x1b[36m%s\x1b[0m",
        "The bot is online! But for some weird reason, you might have to wait a few minutes"
    );

    let commands = client.application.commands;
    commands.create({
        name: "getcovidstat",
        description: "get covid stat",
    });

    commands.create({
        name: "dailystat",
        description: "choose to get covid stat every morning!",
        options: [
            {
                name: "status",
                description: "true if you want to get daily stat, false if you don't.",
                required: true,
                type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
            },
        ],
    });

    commands.create({
        name: "getchart",
        description: "get chart of lastest 30 days",
        options: [
            {
                name: "type",
                description: "type of chart: case, death, recovered",
                required: true,
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
            },
        ],
    });
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand) return;

    const { commandName, options } = interaction;

    if (commandName === "getcovidstat") {
        updateData(() => interaction.reply({ embeds: [covidEmbedMessage()] }));
    } else if (commandName === "dailystat") {
        const status = options.getBoolean("status");
        if (status) {
            const channels = await JSON.parse(fs.readFileSync("./Data/channel.json"));
            if (channels.includes(interaction.channelId)) {
                interaction.reply("This channel is already registered");
                return;
            }

            fs.writeFile(
                "./Data/channel.json",
                JSON.stringify([...channels, interaction.channelId]),
                (err) => {
                    if (err) {
                        interaction.reply(
                            "Sorry, but something went wrong. Please try again later."
                        );
                        return;
                    }

                    interaction.reply(
                        "Successfully add this channels to list, you will get the message every 8 am."
                    );
                }
            );
        } else if (!status) {
            const channels = await JSON.parse(fs.readFileSync("./Data/channel.json"));
            if (!channels.includes(interaction.channelId)) {
                interaction.reply("This channel is not registered");
                return;
            }

            fs.writeFile(
                "./Data/channel.json",
                JSON.stringify(channels.filter((x) => x !== interaction.channelId)),
                (err) => {
                    if (err) {
                        interaction.reply(
                            "Sorry, but something went wrong. Please try again later."
                        );
                        return;
                    }
                    interaction.reply("Successfully unregister this channel.");
                }
            );
        }
    } else if (commandName === "getchart") {
        const type = options.getString("type");
        if (["case", "death", "recovered"].includes(type)) {
            interaction.reply({ files: [`Data/${type}.png`] });
            return;
        } else if (type === "all") {
            interaction.reply("Here you go!");
            client.channels.cache
                .get(interaction.channelId)
                ?.send({ files: [`Data/case.png`, `Data/death.png`, `Data/recovered.png`] })
                .catch((err) =>
                    console.log(
                        `${err.name}: ${err.message} on channel ID ${interaction.channelId}`
                    )
                );
            return;
        }
        interaction.reply("Invalid type");
    }
});

client.login(process.env.DISCORD_TOKEN);

process.on("SIGINT", function () {
    client.destroy();
    console.log("loging out the bot...");

    process.exit();
});
