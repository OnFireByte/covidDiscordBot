require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const schedule = require("node-schedule");
const Discord = require("discord.js");
const intents = new Discord.Intents(32767);
const client = new Discord.Client({ intents });

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
const updateData = (func = () => {}) => {
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

updateData();
console.log("Updating Data...");

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

    updateData();
};

const messageToChannels = () => {
    fs.readFile("./Data/channels.json", "utf8", async (err, data) => {
        if (!data) {
            return;
        }
        channelArr = JSON.parse(data);
        channelArr.forEach((channelID) => {
            client.channels.cache.get(channelID).send();
        });
    });
};

// fectch data at 8 am everyday
schedule.scheduleJob({ hour: 8, dayOfWeek: 0 }, async () => {
    await fetchAPI();
    messageToChannels();
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
    console.log("\x1b[36m%s\x1b[0m", "The bot is online!");

    let commands = client.commands;

    commands?.create({
        name: "getcovidstat",
        description: "get covid stat",
    });

    commands?.create({
        name: "xdd",
        description: "ddd",
    });

    commands?.create({
        name: "dailyStat",
        description: "choose to get covid stat every morning!",
        options: [
            {
                name: "status",
                description: "true if you want to get daily stat, false if you don't.",
                require: true,
                type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN,
            },
        ],
    });
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand) return;

    const { commandName, options } = interaction;

    if (commandName === "getcovidstat") {
        updateData(() => interaction.reply({ embeds: [covidEmbedMessage()] }));
    } else if (commandName === "dailyStat") {
        const status = options[0];
        if (status) {
            const channels = await JSON.parse(fs.readFileSync("./Data/channels.json"));
            if (channels.includes(interaction.channelId)) {
                interaction.reply("This channel is already registered");
                return;
            }

            fs.writeFile(
                "./Data/channels.json",
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
            const channels = await JSON.parse(fs.readFileSync("./Data/channels.json"));
            if (!channels.includes(interaction.channelId)) {
                interaction.reply("This channel is not registered");
                return;
            }

            fs.writeFile(
                "./Data/channels.json",
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
    }
});

client.login(process.env.DISCORD_TOKEN);

process.on("SIGINT", function () {
    client.destroy();
    console.log("loging out the bot...");

    process.exit();
});
