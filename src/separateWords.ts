import fs from 'fs';
const originalPath = './output/original.json';
const parsedPath = './output/parsed.json';
export const spellingPatternBase = "^[A-Z][A-Z;.'1 -,]*$";
export const spellingPatternBase2 = "[A-Z][A-Z;.'1 -,]*";
export const anyCharOrNewline = '(?:.|\n)';
const spellingPattern = `(?<spelling>${spellingPatternBase})`;

// Use [ ] to represent a space because \s and \f don't seem to work for some reason.
const pronunciationPattern = '(?<pronunciation>(?:\n(?!\n)(?![ ]*[(]a)|[^\n])*)';

const definitionPattern = `(?<definition>(?:${anyCharOrNewline}(?!\n\n${spellingPatternBase2}\n))+)`;
const definitionPatternOld = `(?<definition>(?:.*\n\n(?!${spellingPatternBase}))+)`;
const fullPattern = `^(?<rawData>${spellingPattern}\n${pronunciationPattern}(?:\n\n)?${definitionPattern})\n\n`;

const lastWordInData = 'ZYTHUM';
const totalNumberOfWords = 98861;

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

export function separateWords(text: string): RawWordDataResult {
console.log(fullPattern);

  const wordSplitRegex = new RegExp(fullPattern, 'mg');

  const words: Record<string, WordData> = {};
  const wordList: string[] = [];
  let lastSpelling = '';

  let textIndex = 0;
  let result;
  while ((result = wordSplitRegex.exec(text)) !== null) {
    const spelling = result.groups?.spelling;

    // if (spelling === 'BLACK') {
      console.log(result.groups)
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

      throw new Error('***************************** originalTextSection did not match parsed rawData');
    }
    textIndex = textEndIndex;
  }

  // Make sure we parsed all the words in the file.
  if (lastSpelling !== lastWordInData) {
    console.error('unable to finish parsing file, lastSpelling:', lastSpelling)
  }

  // Make sure we got all the words we expected.
  if (wordList.length !== totalNumberOfWords) {
    console.error('unable to finish parsing file, wordList.length:', wordList.length)
  }

  return {
    words,
    wordList
  };
}
