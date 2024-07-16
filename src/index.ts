import fs from 'fs';
import { cleanCharacters } from './cleanCharacters';
import { cleanDefinitionTestingFiles } from './parseDefinition';
import { cleanWordTestingFiles, separateWords } from './separateWords';
import { parseWords } from './parseWords';

// Define the input and output file paths.
const dictionaryDataPath = './data/gutenbergWebstersDictionaryCleaned.txt';
const wordsListPath = './output/wordIdList.json';
const wordsReferencesPath = './output/wordReferences.json';
const wordsDataPath = './output/wordData.json';

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

// Write out the final word data.
fs.writeFileSync(wordsDataPath, JSON.stringify(Object.values(wordIdToWord), null, 2));
fs.writeFileSync(wordsReferencesPath, JSON.stringify(Object.values(wordIdToWordReferenceData), null, 2));
fs.writeFileSync(wordsListPath, JSON.stringify(wordIdList, null, 2));
