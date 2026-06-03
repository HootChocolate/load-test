/**
 * Retorna apenas a primeira letra em Maiusculo
 * @param {string} text 
 * @returns 
 */
export function toSentenceCase(text) {
    if (!text || typeof text !== 'string') return text;

    const lowerText = text.toLowerCase();

    return lowerText.charAt(0).toUpperCase() + lowerText.slice(1);
}

export const redTxt = (txt) => `\n\x1b[31m${txt}\x1b[0m`
export const greenTxt = (txt) => `\n\x1b[32m${txt}\x1b[0m`

export default {
    toSentenceCase
}