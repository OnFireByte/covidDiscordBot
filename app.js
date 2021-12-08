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

const FetchAPI = async () => {
    const rawData = await axios({
        method: "get",
        url: "https://covid19.ddc.moph.go.th/api/Cases/timeline-cases-all",
    });
    const data = await rawData.data;

    fs.writeFile("./Data/cache.json", JSON.stringify(data), (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Successfully update cache.json");
        }
    });
};

schedule.scheduleJob("0 0 8 * *", () => {
    FetchAPI();
});

let cacheData = JSON.parse(fs.readFileSync("./Data/data.json"));

const updateData = (func) => {
    fs.readFile("./Data/data.json", "utf8", (err, data) => {
        cacheData = JSON.parse(data);
        todayData = cacheData[cacheData.length - 1];
        yesterdayData = cacheData[cacheData.length - 2];
        func();
    });
};

let todayData = cacheData[cacheData.length - 1];
let yesterdayData = cacheData[cacheData.length - 2];

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
            { name: "😥 Total Death", value: todayData.total_case.comma(), inline: true },
            { name: "😊 Total Recovered", value: todayData.total_case.comma(), inline: true }
        )
        .setTitle("Total Stat");

client.on("ready", () => {
    console.log("The bot is ready!");

    let commands = client.commands;

    commands?.create({
        name: "getcovidstat",
        description: "get covid stat",
    });
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand) return;

    const { commandName, options } = interaction;

    if (commandName === "getcovidstat") {
        updateData(() => interaction.reply({ embeds: [covidEmbedMessage()] }));
    } else if (commandName === "registerDailyStat") {
    }
});

client.login(process.env.DISCORD_TOKEN);

process.on("SIGINT", function () {
    client.destroy();
    console.log("loging out the bot...");

    process.exit();
});
