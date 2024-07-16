import { parseDefinition, printParseResult } from './parseDefinition';
import { populateReverseLookupForWordVariant } from './createReverseLookup';
import { PhraseWordLookups, buildPhraseWordLookups } from './buildPhraseWordLookups';
import { WordData, WordDataRaw, WordReferenceData, WordVariantRaw } from './wordDataTypes';

const maxWordReferencesToStore = 5000;

export function parseWords(wordIdToRawWord: Record<string, WordDataRaw>, wordIdList: string[]): {wordIdToWord: {[index: string]: WordData}, wordIdToWordReferenceData: {[index: string]: WordReferenceData}} {
  // Find the spellings of all the available words, including words with spaces,
  // and populate a lookup based on word id for all available words.
  const phraseWordLookups: PhraseWordLookups = buildPhraseWordLookups(wordIdList, wordIdToRawWord);

  // Process each word into its variant definitions,
  // populating a reverse lookup as we go through each definition.
  const wordIdToWord: {[index: string]: WordData} = {};
  const wordIdToReferenceWordIds: Map<string, string[]> = new Map();

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
  const wordIdToWordReferenceData: {[index: string]: WordReferenceData} = {};

  // Find words that reference this word.
  wordIdList.forEach(wordId => {
    const wordReferences = wordIdToReferenceWordIds.get(wordId);
    if (wordReferences) {
      if (wordReferences && wordReferences.length > maxWordReferencesToStore) {
        wordIdToWordReferenceData[wordId] = {
          wordId: wordId,
          referenceWordIds: wordReferences.slice(0, maxWordReferencesToStore - 1),
          hasMoreThan5000References: true
        }
      } else {
        wordIdToWordReferenceData[wordId] = {
          wordId: wordId,
          referenceWordIds: wordReferences
        }
      }
    }
  });

  printParseResult();

  return {
    wordIdToWord,
    wordIdToWordReferenceData,
  };
}