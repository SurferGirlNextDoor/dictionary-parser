import fs from 'fs';
import { cleanCharacters } from './cleanCharacters';
import { cleanDefinitionTestingFiles } from './parseDefinition';
import { cleanWordTestingFiles, separateWords } from './separateWords';
import { parseWords } from './parseWords';
import { partitionWordList } from './partitionWordList';
import { WordData, WordReferenceData } from './wordDataTypes';

// Define the input and output file paths.
const dictionaryDataPath = './data/gutenbergWebstersDictionaryCleaned.txt';
const wordsListPath = './output/wordIdList.json';
const wordsReferencesPath = './output/wordReferences.json';
const wordsDataPath = './output/wordData.json';
const wordIdListPathPrefix = './output/wordIdList#';
const wordsDataPathPrefix = './output/wordData#';
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
const { wordIdToWord, wordIdToWordReferenceData } = parseWords(wordIdToRawWord, wordIdList);

// Write out partitioned word list data.
const nameToWordIdPartition = partitionWordList(wordIdList);
Object.keys(nameToWordIdPartition).forEach(partitionName => {

  // Collect all word data for the partition.
  const partitionWordData: WordData[] = [];
  nameToWordIdPartition[partitionName].forEach(wordId => {
    partitionWordData.push(wordIdToWord[wordId]);
  });

  // Collect all the word reference data for the partition.
  const partitionReferenceWordData: WordReferenceData[] = [];
  nameToWordIdPartition[partitionName].forEach(wordId => {
    partitionReferenceWordData.push(wordIdToWordReferenceData[wordId]);
  });

  // Generate partition file names.
  const wordListfilePath = `${wordIdListPathPrefix}${partitionName}.json`;
  const wordDataFilePath = `${wordsDataPathPrefix}${partitionName}.json`;
  const wordReferenceDataFilePath = `${wordsReferencesPathPrefix}${partitionName}.json`;

  // Write out partition data.
  fs.writeFileSync(wordListfilePath, JSON.stringify(nameToWordIdPartition[partitionName], null, 2));
  fs.writeFileSync(wordDataFilePath, JSON.stringify(partitionWordData, null, 2));
  fs.writeFileSync(wordReferenceDataFilePath, JSON.stringify(partitionReferenceWordData, null, 2));
});

// Write out the final word data in big files.
// Note: this is useful for debugging, but not so useful for working with the data in the cloud.
// fs.writeFileSync(wordsDataPath, JSON.stringify(Object.values(wordIdToWord), null, 2));
// fs.writeFileSync(wordsReferencesPath, JSON.stringify(Object.values(wordIdToWordReferenceData), null, 2));
// fs.writeFileSync(wordsListPath, JSON.stringify(wordIdList, null, 2));
