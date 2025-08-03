import fs from 'fs';
import { cleanCharacters } from './cleanCharacters';
import { cleanDefinitionTestingFiles } from './parseDefinition';
import { cleanWordTestingFiles, separateWords } from './separateWords';
import { parseWords } from './parseWords';
import { partitionWordList } from './partitionWordList';
import { createWordDataForPartition } from './createWordDataForPartition';
import { buildPartOfSpeechLookup } from './buildPartOfSpeechLookup';

// Define the input and output file paths.
const dictionaryDataPath = './data/gutenbergWebstersDictionaryCleaned.txt';
const wordsListPath = './output/wordIdList.json';
const wordsReferencesPath = './output/wordReferences.json';
const wordsDataPath = './output/wordData.json';
const partsOfSpeechLookupPath = './output/partsOfSpeechLookup.json';
const spellingsToWordIdsPathPrefix = './output/spellingsToWordIds#';
const wordsDataPathPrefix = './output/wordDisplayData#';
const wordsReferencesPathPrefix = './output/wordReferences#';

// Delete generated data from the last run.
cleanWordTestingFiles();
cleanDefinitionTestingFiles();

// Read the input file.
const rawDictionaryData = fs.readFileSync(dictionaryDataPath, 'utf-8')

// Clean the data.
const dictionaryData = cleanCharacters(rawDictionaryData);

// Separate the words and definition sections so we can parse them further.
const {wordIdToRawWord, wordIdList} = separateWords(dictionaryData);

// Parse the words into the format we need to populate the word lookup,
// including the reverse lookups, into a db.
const { wordIdToWord, wordIdToWordExport } = parseWords(wordIdToRawWord, wordIdList);

// Build out a lookup of part of speech to all the words that identify as that part of speech.
// const partOfSpeechToWordIds: {[index: string]: string[]} = buildPartOfSpeechLookup(wordIdToWord);

// Write out partitioned word list data.
const nameToWordIdPartition = partitionWordList(wordIdList);
Object.keys(nameToWordIdPartition).forEach(partitionName => {
  const  wordData = createWordDataForPartition(nameToWordIdPartition[partitionName], wordIdToWordExport);
 
  // Generate partition file names.
  const wordDataFilePath = `${wordsDataPathPrefix}${partitionName}.json`;

  // Write out partition data.
  fs.writeFileSync(wordDataFilePath, JSON.stringify(wordData, null, 2));
});

// fs.writeFileSync(partsOfSpeechLookupPath, JSON.stringify(partOfSpeechToWordIds, null, 2));

// Write out the final word data in big files.
// Note: this is useful for debugging, but not so useful for working with the data in the cloud.
// fs.writeFileSync(wordsDataPath, JSON.stringify(Object.values(wordIdToWord), null, 2));
// fs.writeFileSync(wordsReferencesPath, JSON.stringify(Object.values(wordIdToWordReferences), null, 2));
// fs.writeFileSync(wordsListPath, JSON.stringify(wordIdList, null, 2));
