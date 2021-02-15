
export const objValueFromPath = function (obj, path) {
    return path.split('.').reduce((o, i) => o[i], obj)
}
