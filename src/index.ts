import fs from 'fs';
import { cleanCharacters } from './cleanCharacters';
import { cleanDefinitionTestingFiles, parseDefinition, printParseResult } from './parseDefinition';
import { cleanWordTestingFiles, separateWords } from './separateWords';
import { populateReverseLookup } from './populateReverseLookup';

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
const {wordsRaw, wordList} = separateWords(dictionaryData);
const words: {[index: string]: WordData} = {};

const reverseLookup: {[index: string]: {[index: string]: boolean}} = {};

wordList.forEach(spelling => {
  const wordDataRaw: WordDataRaw = wordsRaw[spelling];

  const wordData: WordData = {
    spelling: wordDataRaw.spelling,
    variants: [],
    wordsThatReferenceThisWord: []
  };

  // console.log('parsing word: ', word)
  wordDataRaw.variants.forEach(variant => {
    const wordVariant = parseDefinition(spelling, variant);
    wordData.variants.push(wordVariant);
    populateReverseLookup(spelling, variant.definitionSection, reverseLookup);
  });

  words[wordData.spelling] = wordData;
});

wordList.forEach(spelling => {
  const references = reverseLookup[spelling.toLowerCase()];
  if (references) {
    words[spelling].wordsThatReferenceThisWord = Object.keys(references);

    if (words[spelling].wordsThatReferenceThisWord.length > 5000) {
      console.log('lots of refs: ', spelling)
    }
  }
  
});

printParseResult();

fs.writeFileSync(wordsDataPath, JSON.stringify(words, null, 2));
fs.writeFileSync(wordsListPath, JSON.stringify(wordList, null, 2));
