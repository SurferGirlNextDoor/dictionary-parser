import fs from 'fs';
import { cleanCharacters } from './cleanCharacters';
import { cleanDefinitionTestingFiles, parseDefinition, printParseResult } from './parseDefinition';
import { cleanWordTestingFiles, separateWords } from './separateWords';

// Define the input and output file paths.
const dictionaryDataPath = './data/gutenbergWebstersDictionaryCleaned.txt';
const wordsListPath = './output/wordList.json';
const wordsDataPath = './output/wordData.json';

// Delete generated data from the last run.
cleanWordTestingFiles();
cleanDefinitionTestingFiles();

// Read the input file.
const rawDictionaryData = fs.readFileSync(dictionaryDataPath, 'utf-8')

// Clean the data.
const dictionaryData = cleanCharacters(rawDictionaryData);

// Separate the words and definition sections so we can parse them further.
const {words, wordList} = separateWords(dictionaryData);

wordList.forEach(word => {
  const wordData = words[word];
  // console.log('parsing word: ', word)
  wordData.variants.forEach(variant => {
    parseDefinition(word, variant.definitionSection);
  });
});

printParseResult();

fs.writeFileSync(wordsDataPath, JSON.stringify(words, null, 2));
fs.writeFileSync(wordsListPath, JSON.stringify(wordList, null, 2));
