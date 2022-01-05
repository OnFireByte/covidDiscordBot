import { readFile } from "fs";
import { covidEmbedMessage } from "./covidEmbedMessage.js";
import { client } from "../app.js";

export const messageToChannels = () => {
    readFile("./Data/channel.json", "utf8", async (err, data) => {
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
