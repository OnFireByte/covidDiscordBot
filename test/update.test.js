import { updateData, todayData } from "../module/fetchAndUpdate.js";

(async () => {
    await updateData(() => console.log(todayData));
})();
