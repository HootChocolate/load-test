/**
 * Retorna o primeiro valor se estiver preenchido, senão retorna o segundo
 * @param {*} first 
 * @param {*} second 
 * @returns 
 */
export function nvl(first, second) {
    return first !== undefined ? first : second;
}

export function isNullOrEmpty(value) {
    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === "string" && value.trim() === "") {
        return true;
    }

    if (Array.isArray(value) && value.length === 0) {
        return true;
    }

    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
        return true;
    }

    return false;
}

export default {
    nvl,
    isNullOrEmpty
}