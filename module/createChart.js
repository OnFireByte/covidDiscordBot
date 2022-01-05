import { writeFileSync } from "fs";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

const width = 1000; //px
const height = 500; //px
const backgroundColour = "white";
const canvasRenderService = new ChartJSNodeCanvas({ width, height, backgroundColour });

const format_arr = (arr, mode) => {
    let keyword;
    if (mode === "case") {
        keyword = "new_case";
    } else if (mode === "death") {
        keyword = "new_death";
    } else if (mode === "recovered") {
        keyword = "new_recovered";
    } else if (mode === "date") {
        return arr.map((x) => {
            const rawDateArr = x.txn_date.split("-");
            const date = rawDateArr[2];
            const month = rawDateArr[1];
            return `${date}/${month}`;
        });
    } else {
        return;
        // throw "invalid mode";
    }
    return arr.map((x) => x[keyword]);
};

const format_mode = (mode) => {
    switch (mode) {
        case "case":
            return {
                label: "Number of infected per day",
                color: ["rgba(255, 165, 0, 1)"],
            };

        case "death":
            return {
                label: "Number of death per day",
                color: ["rgba(255, 99, 132, 1)"],
            };

        case "recovered":
            return {
                label: "Number of recovered per day",
                color: ["rgba(60, 179, 113, 1)"],
            };

        default:
            return;
        // throw "invalid mode";
    }
};

const create = async (arr, mode, path) => {
    const mode_arr = format_arr(arr, mode);
    const date_arr = format_arr(arr, "date");
    const prop = format_mode(mode);

    const configuration = {
        type: "line",
        data: {
            labels: date_arr,
            datasets: [
                {
                    label: prop.label,
                    data: mode_arr,
                    backgroundColor: prop.color,
                    borderColor: prop.color,
                    borderWidth: 2,
                    tension: 0.25,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                },
            },
            interaction: {
                mode: "index",
                intersect: false,
            },
        },
    };

    const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

    // Write image to file
    writeFileSync(path, imageBuffer);
};

export default create;
