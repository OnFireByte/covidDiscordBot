Number.prototype.comma = function () {
    return this.valueOf()
        .toString()
        .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
};
export const diff = (a, b) => {
    return a - b >= 0 ? `+${(a - b).comma()}` : `-${(b - a).comma()}`;
};
