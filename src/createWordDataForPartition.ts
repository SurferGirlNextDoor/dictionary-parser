import { WordData, WordDisplayData, WordDisplayVariant, WordReferenceData } from "./wordDataTypes";

// The spelling 'CONSTRUCTOR' can't be used as an object key is js so we add a prefix to all spellings.
const spellingPrefix = '#';

export function createWordDataForPartition(wordIdPartition: string[], 
  wordIdToWord: {[index: string]: WordData}, 
  wordIdToWordReferenceData: {[index: string]: WordReferenceData}): {
    spellingToWordIds: {[index: string]: string[]},
    referenceWords: WordReferenceData[],
  wordDisplayData: WordDisplayData[]
} {
  const spellingToWordIds: {[index: string]: string[]} = {};
  const referenceWords: WordReferenceData[] = [];
  const wordDisplayData: WordDisplayData[] = [];

  wordIdPartition.forEach(wordId => {
    const wordData = wordIdToWord[wordId];

    // Collect all the spellings for the word.
    wordData.spellings.forEach(spelling => {
      if (spelling) {
        const prefixedSpelling = `${spellingPrefix}${spelling}`
        const wordIds = spellingToWordIds[prefixedSpelling];
        if (!wordIds) {
          spellingToWordIds[prefixedSpelling] = [wordId];
        } else {
          wordIds.push(wordId);
        }
      }
    });

    // Collect all the word reference data for the word.
    const wordReferenceData: WordReferenceData = wordIdToWordReferenceData[wordId];
    if (wordReferenceData) {
      referenceWords.push(wordReferenceData);
    }

    // Collect all the display variants for the word.
    const variants: WordDisplayVariant[] = [];
    wordData.variants.forEach(variant => {
      if (variant) {
        variants.push({
          rawData: variant.rawData,
          isArchaic: variant.isArchaic,
          isObsolete: variant.isObsolete,
          partsOfSpeech: variant.partsOfSpeech,
        });
      }
    });

    // Collect all the display data for the word.
    wordDisplayData.push({
      wordId,
      spellingsString: wordData.spellingsString,
      variants,
      hasReferences: !!wordReferenceData
    });
  });


  return {
    spellingToWordIds,
    referenceWords,
    wordDisplayData
  }
}