

import fs from 'fs';
import { spellingPattern } from './separateWords';
import { parsePartsOfSpeech } from './parsePartsOfSpeech';
import { WordVariant, WordVariantRaw } from './wordDataTypes';

const originalDefPath = './output/originalDef.json';
const parsedDefPath = './output/parsedDef.json';

// Matches a paragraph that is separated from other paragraphs using
// two newlines (a single newline represents another line in the current paragraph).
const paragraphSplitterPattern = '^(?<paragraph>(\n(?!\n)|[^\n])*)\n\n';

const baseDefinitionPattern = `(?<defaultDef>^Defn:.*)?`
const numberedDefinitionPattern = `(?<numberedDef>^[0-9].*)?`
const letteredDefinitionPattern = `(?<letteredDef>^[(][a-c][)].*)?`

const synonymPattern = `(?<synonym>^Syn..*)?`
const notePattern = `(?<note>^Note:..*)?`

// `OTHER: ` and `EXAMPLE: ` is added to the "cleaned version of the data to mark unexpected
// definition sections that don't fit into another general category.
const otherPattern = `(?<other>^OTHER: .*)?`
const examplePattern = `(?<example>^EXAMPLE: .*)?`;

const unlabeledParagraphPattern = `(?<unlabeled>^.*)?`;

const definitionFormatOptions = [
  baseDefinitionPattern,
  numberedDefinitionPattern,
  letteredDefinitionPattern,
  synonymPattern,
  notePattern,
  otherPattern,
  examplePattern,
  unlabeledParagraphPattern
].join('');
const fullPattern = `(?<rawDefinitionData>${definitionFormatOptions})`;


let numberOfMismatches = 0;

export function cleanDefinitionTestingFiles() {
  if (fs.existsSync(originalDefPath)) {
    fs.unlinkSync(originalDefPath);
  }
  if (fs.existsSync(parsedDefPath)) {
    fs.unlinkSync(parsedDefPath);
  }
}

export function parseDefinition(spelling: string, variantRaw: WordVariantRaw): WordVariant {
  const definitionSectioningRegex = new RegExp(paragraphSplitterPattern, 'mg');
  let rawSections: string[] = [];
  let result;

  const wordVariant: WordVariant = {
    pronunciation: variantRaw.pronunciation,
    rawData: variantRaw.rawData,
    definitions: []
  };

  const partsOfSpeechResult = parsePartsOfSpeech(spelling, variantRaw.pronunciation);
  if (partsOfSpeechResult) {
    if (partsOfSpeechResult.partsOfSpeech?.length > 0) {
      wordVariant.partsOfSpeech = partsOfSpeechResult.partsOfSpeech;
    }
    if (partsOfSpeechResult.isArchaic) {
      wordVariant.isArchaic = true;
    }
    if (partsOfSpeechResult.isObsolete) {
      wordVariant.isObsolete = true;
    }
  }

  const definitionSection = variantRaw.definitionSection;
  if (definitionSection.trim() === '') {
    console.error(`No definition section found for spelling ${spelling}`);
  }

  const definitionSectionWithEndingNewlines = `${definitionSection}\n\n`;
  while ((result = definitionSectioningRegex.exec(definitionSectionWithEndingNewlines)) !== null) {
    const rawDefinitionSection = result.groups?.paragraph;
    if (!rawDefinitionSection) {
      throw new Error('***************************** missing definition section');
    }

    rawSections.push(rawDefinitionSection);


    const sectionRegex = new RegExp(fullPattern, 'mg');

    const sectionResult = sectionRegex.exec(rawDefinitionSection);
    if (!sectionResult) {
      throw new Error('***************************** unable to parse definition section');
    }

    const defaultDef = sectionResult.groups?.defaultDef;
    const numberedDef = sectionResult.groups?.numberedDef;
    const letteredDef = sectionResult.groups?.letteredDef;
    const synonym = sectionResult.groups?.synonym;
    const note = sectionResult.groups?.note;
    const other = sectionResult.groups?.other;
    const example = sectionResult.groups?.example;
    const unlabeled = sectionResult.groups?.unlabeled;

    if (unlabeled) {

      // Make sure we aren't mistaking a new word for a part of the previous definition.
      const spellingRegex = new RegExp(spellingPattern, 'mg');
      if (spellingRegex.test(unlabeled)) {
        console.log('-----------');
        console.log('word: ', spelling);
        console.log(unlabeled);
      }
    }

    if (defaultDef) {
      wordVariant.definitions.push(rawDefinitionSection);
    }
    if (numberedDef) {
      wordVariant.definitions.push(rawDefinitionSection);
    }
    if (letteredDef) {
      wordVariant.definitions.push(rawDefinitionSection);
    }
    if (synonym) {
      if (!wordVariant.synonyms) {
        wordVariant.synonyms = [];
      }
      wordVariant.synonyms.push(rawDefinitionSection);
    }

    if (note) {
      if (!wordVariant.notes) {
        wordVariant.notes = [];
      }
      wordVariant.notes.push(rawDefinitionSection);
    }
    if (other) {
      if (!wordVariant.others) {
        wordVariant.others = [];
      }
      wordVariant.others.push(rawDefinitionSection);
    }
    if (example) {
      if (!wordVariant.examples) {
        wordVariant.examples = [];
      }
      wordVariant.examples.push(rawDefinitionSection);
    }
  }

  // Make sure we got all of the data when we parsed the sections.
  const parsedRawData = rawSections.join('\n\n').trim();
  if (parsedRawData !== definitionSection.trim()) {
    fs.writeFileSync(originalDefPath, definitionSection);
    fs.writeFileSync(parsedDefPath, parsedRawData);

    console.log('spelling', spelling)
    throw new Error('***************************** originalDefinitionSection did not match parsed rawData');
    numberOfMismatches++;
  }

  return wordVariant;
}

export function printParseResult() {
  if (numberOfMismatches) {
    console.log('mismatch count:', numberOfMismatches)
  }
}
