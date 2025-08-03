import { parseDefinition, printParseResult } from './parseDefinition';
import { populateReverseLookupForWordVariant } from './createReverseLookup';
import { PhraseWordLookups, buildPhraseWordLookups } from './buildPhraseWordLookups';
import { WordData, WordDataRaw, WordExportData, WordVariantRaw } from './wordDataTypes';

const maxWordReferencesToStore = 1000;

function getWordInfoForWordIds(wordIds: string[], wordIdToRawWord: Record<string, WordDataRaw>): string[] {
  const references: string[] = [];

  wordIds.forEach(wordId => {
    const rawWord = wordIdToRawWord[wordId];
    references.push(rawWord.spellingsString);
  });

  return references;
}

export function parseWords(wordIdToRawWord: Record<string, WordDataRaw>, wordIdList: string[]): {wordIdToWord: {[index: string]: WordData}, wordIdToWordExport: {[index: string]: WordExportData}} {
  // Find the spellings of all the available words, including words with spaces,
  // and populate a lookup based on word id for all available words.
  const phraseWordLookups: PhraseWordLookups = buildPhraseWordLookups(wordIdList, wordIdToRawWord);

  // Process each word into its variant definitions,
  // populating a reverse lookup as we go through each definition.
  const wordIdToWord: {[index: string]: WordData} = {};
  const wordIdToReferenceWordIds: Map<string, Map<string, boolean>> = new Map();

  wordIdList.forEach(wordId => {
    const wordDataRaw: WordDataRaw = wordIdToRawWord[wordId];

    const wordData: WordData = {
      id: wordDataRaw.id,
      spellingsString: wordDataRaw.spellingsString,
      spellings: wordDataRaw.spellings,
      variants: [],
    };

    // console.log('parsing word: ', word)
    wordDataRaw.variants.forEach((variant: WordVariantRaw) => {
      const wordVariant = parseDefinition(wordData.spellingsString, variant);
      wordData.variants.push(wordVariant);
      populateReverseLookupForWordVariant(wordData.id, wordData.spellings, wordVariant.rawData, phraseWordLookups, wordIdToReferenceWordIds);
    });

    wordIdToWord[wordData.id] = wordData;
  });

  // Populate reverse lookup reference data.
  const wordIdToWordExport: {[index: string]: WordExportData} = {};

  // Find words that reference this word.
  wordIdList.forEach(wordId => {
    const rawWord = wordIdToRawWord[wordId];
    const variants = rawWord.variants.map(variant => variant.rawData);
    const referenceWordIds: string[] = Array.from(wordIdToReferenceWordIds.get(wordId)?.keys() || []);
    if (referenceWordIds) {
      if (referenceWordIds && referenceWordIds.length > maxWordReferencesToStore) {
        const references = getWordInfoForWordIds(referenceWordIds.slice(0, maxWordReferencesToStore - 1), wordIdToRawWord);
        wordIdToWordExport[wordId] = {
          spellings: rawWord.spellingsString,
          variants,
          references,
          hasMoreThan1000References: true
        }
      } else {
        const references = getWordInfoForWordIds(referenceWordIds, wordIdToRawWord);
        wordIdToWordExport[wordId] = {
          spellings: rawWord.spellingsString,
          variants,
          references,
        }
      }
    }
  });

  printParseResult();

  return {
    wordIdToWord,
    wordIdToWordExport,
  };
}
