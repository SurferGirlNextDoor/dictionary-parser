import fs from 'fs';
const originalPath = './output/original.json';
const parsedPath = './output/parsed.json';

export const spellingPatternBase = "^[A-Z][A-Z;.'1 ,-]*$";
export const anyCharOrNewline = '(?:.|\n)';
export const spellingPattern = `(?<spelling>${spellingPatternBase})`;

// Use [ ] to represent a space because \s and \f don't seem to work for some reason.
const doubleNewlineOrStartOfDefinition = '\n(?:\n|[ ]*[(]a)';
const notADoubleNewlineOrStartOfDefinition = '\n(?!\n)(?![ ]*[(]a)';

const pronunciationPattern = `(?<pronunciation>(?:${notADoubleNewlineOrStartOfDefinition}|[^\n])*)`;

const definitionPattern = `(?<definition>(?:${anyCharOrNewline}(?!${spellingPatternBase}))+)`;
const fullPattern = `(?<rawData>${spellingPattern}\n${pronunciationPattern}${doubleNewlineOrStartOfDefinition}${definitionPattern})\n\n`;

// To log the pattern, replace the invisible newlines with the newline string
// when writing to the console.
// console.log(fullPattern.replace(/\n/g, '\\n'))

const lastWordInData = 'ZYTHUM';
const totalNumberOfWords = 98859;

function addWord(words: Record<string, WordData>, 
  wordList: string[], 
  spelling: string, 
  pronunciation: string, 
  definitionSection: string,
  rawData: string) {
  if (!words[spelling]) {
    words[spelling] = {
      spelling,
      variants: []
    };
    wordList.push(spelling);
  }

  words[spelling].variants.push({
    pronunciation,
    definitionSection,
    rawData
  });
}

export function cleanWordTestingFiles() {
  if (fs.existsSync(originalPath)) {
    fs.unlinkSync(originalPath);
  }
  if (fs.existsSync(parsedPath)) {
    fs.unlinkSync(parsedPath);
  }
}

export function findAllWords(text: string): Record<string, number> {
  const allWords: Record<string, number> = {};
  let result;
  const spellingRegex = new RegExp(spellingPattern, 'mg');

  while ((result = spellingRegex.exec(text)) !== null) {
    const spelling = result.groups?.spelling;
    if (!spelling) {
      throw new Error('***************************** find all word pass: no word found');
    }

    // End of file marker does not count as a word
    if (spelling === 'ENDOFFILE') {
      continue;
    }

    if (allWords[spelling]) {
      allWords[spelling] = allWords[spelling] + 1;
    }
    
    allWords[spelling] = 1;
  }

  const wordsFoundCount = Object.keys(allWords).length;
  if (wordsFoundCount !== totalNumberOfWords) {
    console.log(`Found an unexpected number of words: ${wordsFoundCount}.  Number of words expected: ${totalNumberOfWords}`)
  }

  return allWords;
}

export function separateWords(text: string): RawWordDataResult {
  // Find all the words using their formatting so we can double check that we are parsing the
  // word pronunciations and definitions correctly.
  const allWords = findAllWords(text);

  const wordSplitRegex = new RegExp(fullPattern, 'mg');

  const words: Record<string, WordData> = {};
  const wordList: string[] = [];
  let lastSpelling = '';

  let textIndex = 0;
  let result;
  while ((result = wordSplitRegex.exec(text)) !== null) {
    const spelling = result.groups?.spelling;

    // if (spelling === 'BLACK') {
      // console.log(result.groups)
    // }

    if (!spelling) {
      throw new Error('***************************** no word found');
    }
    const rawData = result.groups?.rawData;
    if (!rawData) {
      throw new Error('***************************** no rawData found');
    }
    const pronunciation = result.groups?.pronunciation;
    if (!pronunciation) {
      throw new Error('***************************** no pronunciation found');
    }
    const definition = result.groups?.definition;
    if (!definition) {
      console.log('rawData', rawData)
      throw new Error('***************************** no definition found');
    }

    const trimmedRawData = rawData.trim();

    addWord(words, wordList, spelling, pronunciation.trim(), definition.trim(), trimmedRawData);

    lastSpelling = spelling;
    const textEndIndex = textIndex + rawData.length + 2; // +2 for the \n\n
    const trimmedOriginalText = text.slice(textIndex, textEndIndex).trim();
    if (trimmedOriginalText !== trimmedRawData) {
      fs.writeFileSync(originalPath, trimmedOriginalText);
      fs.writeFileSync(parsedPath, trimmedRawData);

      throw new Error(`***************************** originalTextSection did not match parsed rawData: ${spelling}`);
    }
    textIndex = textEndIndex;
  }

  // Make sure we parsed all the words in the file.
  if (lastSpelling !== lastWordInData) {
    console.error('unable to finish parsing file, lastSpelling:', lastSpelling)
  }

  // Make sure we got all the words we expected.
  if (wordList.length !== totalNumberOfWords) {
    console.log('unable to finish parsing file, wordList.length:', wordList.length)
  }

  const wordsFoundOnlyInWordSearch = Object.keys(allWords).filter(wordSpelling => !words[wordSpelling]);
  const wordsFoundOnlyInDefinitionSearch = Object.keys(words).filter(wordSpelling => allWords[wordSpelling] === undefined);

  if (wordsFoundOnlyInDefinitionSearch.length || wordsFoundOnlyInWordSearch.length) {
    if (wordsFoundOnlyInDefinitionSearch.length) {
      console.error(`******************* Words found only in definition search: ${wordsFoundOnlyInDefinitionSearch}`)
    }
    
    if (wordsFoundOnlyInWordSearch.length) {
      wordsFoundOnlyInWordSearch.forEach(word => console.log(word));
      console.error(`******************* Words found only in word search: ${wordsFoundOnlyInWordSearch}`)
    }
  }

  return {
    words,
    wordList
  };
}
