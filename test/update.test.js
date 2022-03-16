import { diff } from "../module/diff.js";
const todayData = {};
const yesterdayData = {};
const obj = [
    {
        name: "🤒 New Case",
        value: `${todayData?.new_case?.comma()} (${diff(
            todayData?.new_case,
            yesterdayData?.new_case
        )})`,
        inline: true,
    },
    {
        name: "😥 New Death",
        value: `${todayData?.new_death?.comma()} (${diff(
            todayData?.new_death,
            yesterdayData?.new_death
        )})`,
        inline: true,
    },
    {
        name: "😊 New Recovered",
        value: `${todayData?.new_recovered?.comma()} (${diff(
            todayData?.new_recovered,
            yesterdayData?.new_recovered
        )})`,
        inline: true,
    },
    { name: "\u200B", value: "\u200B" },
    { name: "🤒 Total Case", value: todayData?.total_case?.comma(), inline: true },
    { name: "😥 Total Death", value: todayData?.total_death?.comma(), inline: true },
    { name: "😊 Total Recovered", value: todayData?.total_recovered?.comma(), inline: true },
];
console.log(obj);
