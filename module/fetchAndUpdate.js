import axios from "axios";
import { readFile, writeFile, existsSync, mkdirSync } from "fs";
import createChart from "./createChart.js";

let cacheData;
export let todayData;
export let yesterdayData;
export const updateData = async (func = () => {}) => {
    console.log("Updating Data...");
    readFile("./Data/data.json", "utf8", async (_err, data) => {
        if (!data) {
            await fetchAPI();
            return;
        }
        try {
            cacheData = JSON.parse(data);
            todayData = cacheData[cacheData.length - 1];
            yesterdayData = cacheData[cacheData.length - 2];
            func();
        } catch (err) {
            setTimeout(async () => {
                await updateData();
            }, 3000);
            return;
        }
    });
};
export const fetchAPI = async (tryCount = 0) => {
    if (!existsSync("./Data")) {
        mkdirSync("./Data");
    }
    try {
        const rawData = await axios({
            method: "get",
            url: "https://covid19.ddc.moph.go.th/api/Cases/timeline-cases-all",
        });
        const data = await rawData.data.filter(
            (v, i, a) => a.findIndex((t) => t.txn_date === v.txn_date) === i
        );
        writeFile("./Data/data.json", JSON.stringify(data.slice(-30)), { flag: "w" }, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully update data.json");

                updateData(() => {
                    console.log("updating chart...");
                    createChart(cacheData, "case", "Data/case.png");
                    createChart(cacheData, "death", "Data/death.png");
                    createChart(cacheData, "recovered", "Data/recovered.png");
                });
            }
        });
    } catch {
        if (tryCount >= 4) {
            console.log(
                "We try to fetch for 5 times, but server never respond. So we won't try to fetch again"
            );
            return;
        }
        console.log("look like server is down, will try to fetch again in next 5 minute");
        setTimeout(async () => {
            await fetchAPI();
        }, 300000);
    }
};
