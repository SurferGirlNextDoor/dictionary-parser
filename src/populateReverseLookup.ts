import { spellingPatternBase } from "./separateWords";

export const otherWordPattern = `(?<otherWord>${spellingPatternBase})`;

/**
 * Find all the other words that this word references and populate a lookup
 * @param spelling the spelling of the word
 * @param definitionSection the definition section of the variant of the word (includes full details like synonyms, etc.)
 * @param reverseLookup the dictionary we will populate with reverse lookup data
 */
export function populateReverseLookup(spelling: string, definitionSection: string, reverseLookup: {[index: string]: {[index: string]: boolean}}) {
  const otherPossibleWords = definitionSection.split(' ');

  otherPossibleWords.forEach(otherPossibleWord => {
    const otherWordRegex = new RegExp(otherWordPattern, 'mgi');
    const otherWordResult = otherWordRegex.exec(otherPossibleWord);
    if (otherWordResult && otherWordResult.groups?.otherWord) {
      const otherWordLowered = otherWordResult.groups?.otherWord.toLowerCase();
      if (!reverseLookup[otherWordLowered]) {
        reverseLookup[otherWordLowered] = {};
      }
      reverseLookup[otherWordLowered][spelling] = true;
    }
  })
}
