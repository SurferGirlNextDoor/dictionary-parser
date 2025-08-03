import { WordData, WordExportData, WordVariant } from "./wordDataTypes";

export function buildPartOfSpeechLookup(wordIdToWord: {[index: string]: WordData}): {[index: string]: string[]} {
  const partOfSpeechToWordIds: {[index: string]: string[]} = {};

  Object.keys(wordIdToWord).forEach(wordId => {
    const wordData = wordIdToWord[wordId];
    wordData.variants.forEach((variant: WordVariant) => {
      if (variant.partsOfSpeech) {
        variant.partsOfSpeech.forEach(partOfSpeech => {
          if (!partOfSpeechToWordIds[partOfSpeech]) {
            partOfSpeechToWordIds[partOfSpeech] = [];
          }
          partOfSpeechToWordIds[partOfSpeech].push(wordId);
        });
      }
    });
  });

  return partOfSpeechToWordIds;
}