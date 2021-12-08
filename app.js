require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const schedule = require("node-schedule");
const Discord = require("discord.js");
const { Intents } = require("discord.js");
const intents = new Discord.Intents(32767);
const client = new Discord.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

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
    fs.readFile("./Data/channel.json", "utf8", async (err, data) => {
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

    const guildId = "918061578371342336";
    const guild = client.guilds.cache.get(guildId);
    let commands;
    if (guild) {
        commands = guild.commands;
    } else {
        commands = client.application?.commands;
    }
    commands?.create({
        name: "getcovidstat",
        description: "get covid stat",
    });
    console.log("create command");
    commands?.create({
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
    }
});

client.login(process.env.DISCORD_TOKEN);

process.on("SIGINT", function () {
    client.destroy();
    console.log("loging out the bot...");

    process.exit();
});
