import { WordExportData } from "./wordDataTypes";

export function createWordDataForPartition(wordIdPartition: string[], 
  wordIdToWord: {[index: string]: WordExportData}): WordExportData[] {
  const wordExports: WordExportData[] = [];

  wordIdPartition.forEach(wordId => {
    const wordExport: WordExportData = wordIdToWord[wordId];

    // Collect all the display data for the word.
    wordExports.push(wordExport);
  });

  return wordExports;
}