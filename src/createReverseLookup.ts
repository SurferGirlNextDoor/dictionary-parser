import { PhraseWordLookups } from "./buildPhraseWordLookups";
import { singleSpellingPattern } from "./separateWords";

export const otherWordPattern = `(?<otherWord>${singleSpellingPattern})`;

/**
 * Find all the other words that this word references and populate a lookup
 * @param wordId the word id of the word whose definition we are checking other word references
 * @param spelling the word spelling of the word whose definition we are checking other word references
 * @param definitionSection the definition section of the variant of the word (includes full details like synonyms, etc.)
 * @param reverseLookup the dictionary we will populate with reverse lookup data
 */
export function populateReverseLookupForWordVariant(wordId: string, wordSpellings: string[], definitionSection: string, phraseWordLookups: PhraseWordLookups, wordIdToReferenceWordIds: Map<string, Map<string, boolean>>) {
  const loweredDefinitionSection = definitionSection.toLowerCase();
  const otherPossibleWords = loweredDefinitionSection.split(/\s/);

  const wordSpellingsLowered = wordSpellings.map(spelling => spelling.toLowerCase());

  // Parse the definition into the individual words it contains and
  // track those words as references.
  otherPossibleWords?.forEach(otherPossibleWord => {

    // Check if the item is an actual word (vs. only punctuation, etc.)
    const otherWordRegex = new RegExp(otherWordPattern, 'mgi');
    const otherWordResult = otherWordRegex.exec(otherPossibleWord);
    if (otherWordResult && otherWordResult.groups?.otherWord) {
      const otherWordLowered = otherWordResult.groups?.otherWord.toLowerCase();

      // Add the reference for the word, if it exists in the dictionary.
      // Don't bother adding references to the same word
      if (!wordSpellingsLowered.includes(otherWordLowered)) {
        const referenceWordId = phraseWordLookups.loweredWordToWordId.get(otherWordLowered);
        if (referenceWordId) {
          if (!wordIdToReferenceWordIds.get(referenceWordId)) {
            wordIdToReferenceWordIds.set(referenceWordId, new Map());
          }
          wordIdToReferenceWordIds.get(referenceWordId)?.set(wordId, true);
        }
      }

      // Find any references to possible multi part words (words with spaces)
      // so we can find and include those as well.
      // Note: this slows down the parsing quite a bit
      // because there are 3082 spellings that contain spaces.
      const possiblePhraseWords = phraseWordLookups.wordPartToPhraseWords.get(otherWordLowered);
      if (possiblePhraseWords) {
        possiblePhraseWords.forEach(phraseWord => {
          if (loweredDefinitionSection.includes(phraseWord)) {

            // If the whole phrase word is present, add it to the reverse lookup.
            const referenceWordId = phraseWordLookups.loweredWordToWordId.get(phraseWord);
            if (referenceWordId) {
              if (!wordIdToReferenceWordIds.get(referenceWordId)) {
                wordIdToReferenceWordIds.set(referenceWordId, new Map());
              }
              wordIdToReferenceWordIds.get(referenceWordId)?.set(wordId, true);
            }
          }
        });
      }
    }
  });
}
