import { writeFile, readFileSync, writeFileSync, existsSync } from "fs";
import { RecurrenceRule, scheduleJob } from "node-schedule";
import dotenv from "dotenv";
import { Intents, Client, Constants } from "discord.js";
import { fetchAPI, updateData } from "./module/fetchAndUpdate.js";
import { dailyFetch } from "./module/dailyFetch.js";
import { covidEmbedMessage } from "./module/covidEmbedMessage.js";
import { messageToChannels } from "./module/messageToChannels.js";
const intents = new Intents(32767);
export const client = new Client({ intents });

dotenv.config();

await fetchAPI();

let timerule = new RecurrenceRule();
// 8 am at bangkok
timerule.tz = "Asia/Bangkok";
timerule.second = 0;
timerule.minute = 0;
timerule.hour = 8;

// fectch data at 8 am everyday
scheduleJob(timerule, async () => {
    console.log("Dayly Routine...");
    await dailyFetch();
});

process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.on("data", async (text) => {
    if (text.trim().toLowerCase() === "fetch") {
        await fetchAPI();
    } else if (text.trim().toLowerCase() === "mtc") {
        await updateData();
        messageToChannels();
    } else if (text.trim().toLowerCase() === "daily") {
        await dailyFetch();
    } else {
        console.log("Unknown command");
    }
});

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
                type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
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
                type: Constants.ApplicationCommandOptionTypes.STRING,
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
        if (!existsSync("./Data")) {
            mkdirSync("./Data");
        }
        if (!existsSync("./Data/channel.json")) {
            writeFileSync("./Data/channel.json", "[]", { flag: "w" });
        }
        const status = options.getBoolean("status");
        if (status) {
            const channels = await JSON.parse(readFileSync("./Data/channel.json"));
            if (channels.includes(interaction.channelId)) {
                interaction.reply("This channel is already registered");
                return;
            }

            writeFile(
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
            const channels = await JSON.parse(readFileSync("./Data/channel.json"));
            if (!channels.includes(interaction.channelId)) {
                interaction.reply("This channel is not registered");
                return;
            }

            writeFile(
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
