import { readFile } from "fs";
import { DateTime } from "luxon";
import { fetchAPI } from "./fetchAndUpdate.js";
import { messageToChannels } from "./messageToChannels.js";

export const dailyFetch = async (tryCount = 0) => {
    const today = DateTime.now().setZone("Asia/Bangkok").day;
    await fetchAPI();
    readFile("./Data/data.json", "utf8", async (_err, data) => {
        const cacheData = JSON.parse(data);
        const newestData = cacheData[cacheData.length - 1];
        const newestDate = Number(newestData.txn_date.split("-")[2]);
        if (newestDate == today || tryCount >= 5) {
            messageToChannels();
            return;
        }
        console.log("The data is not up-to-date, will fetch data again in next 1 hour");
        setTimeout(async () => {
            await dailyFetch(tryCount + 1);
        }, 3600000);
    });
};
