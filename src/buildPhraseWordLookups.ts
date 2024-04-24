import { WordDataRaw } from "./wordDataTypes";

/**
 * Some spellings contain spaces, for example: ALPHA RAYS
 * In this example, "ALPHA" and "RAYS" are word parts and "ALPHA RAYS" is the word phrase.
 * During parsing, it is helpful to look up possible phrase words based on their word parts.
 */
export interface PhraseWordLookups {

  /**
   * Used to look up the word id from any word.
   */
  loweredWordToWordId: Map<string, string>;

  /**
   * Used to look up possible phrase words based on a word part.  For example, 
   * `wordPartToPhraseWords["alpha"]` will return an array containing the possible word phrases, 
   * i.e. `['alpha rays', 'alpha paper']`
   */
  wordPartToPhraseWords: Map<string, string[]>;
}

export function buildPhraseWordLookups(wordIdList: string[], wordIdToRawWord: Record<string, WordDataRaw>): PhraseWordLookups {
  const wordPartToPhraseWords: Map<string, string[]> = new Map();
  const loweredWordToWordId: Map<string, string> = new Map();

  wordIdList.forEach(wordId => {
    const wordDataRaw: WordDataRaw = wordIdToRawWord[wordId];
  
    wordDataRaw.spellings.forEach(spelling => {
      const loweredSpelling = spelling.toLowerCase();

      // Populate wordPartToPhraseWords.
      // Keep track of spellings with spaces for the reverse lookup
      // because we will need to look for these specially.
      if (loweredSpelling.includes(' ')) {
        const wordParts = loweredSpelling.split(' ');
        wordParts.forEach(wordPart => {
          if (!wordPartToPhraseWords.get(wordPart)) {
            wordPartToPhraseWords.set(wordPart, []);
          }
          wordPartToPhraseWords.get(wordPart)?.push(loweredSpelling);
        })
      }

      // Populate loweredWordToWordId.
      loweredWordToWordId.set(loweredSpelling, wordDataRaw.id);
    });
  });

  return {
    loweredWordToWordId,
    wordPartToPhraseWords
  };
}
