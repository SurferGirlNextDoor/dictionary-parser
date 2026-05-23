import fs from 'fs';
import { cleanCharacters } from './cleanCharacters';
import { cleanDefinitionTestingFiles } from './parseDefinition';
import { cleanWordTestingFiles, separateWords } from './separateWords';
import { parseWords } from './parseWords';
import { partitionWordList } from './partitionWordList';
import { createWordDataForPartition } from './createWordDataForPartition';
import { buildPartOfSpeechLookup } from './buildPartOfSpeechLookup';
import { computeComponents } from './computeComponents';

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
const { wordIdToWord, wordIdToWordExport, unresolvedThesaurusWords } = parseWords(wordIdToRawWord, wordIdList);

// Build out a lookup of part of speech to all the words that identify as that part of speech.
// const partOfSpeechToWordIds: {[index: string]: string[]} = buildPartOfSpeechLookup(wordIdToWord);

// Ensure the output directory exists.
fs.mkdirSync('./output', { recursive: true });

// Compute connected components across the full word graph and stamp each
// export entry with its component ID before writing partition files.
const { wordIdToComponentId, summary: componentSummary } = computeComponents(wordIdList, wordIdToWordExport);
wordIdList.forEach(wordId => {
  wordIdToWordExport[wordId].componentId = wordIdToComponentId.get(wordId) ?? 0;
});
fs.writeFileSync('./output/componentSummary.json', JSON.stringify(componentSummary, null, 2));
console.log(`Components: ${componentSummary.totalComponents} total — main component contains ${componentSummary.mainComponentSize} words`);

// Write out partitioned word list data.
const nameToWordIdPartition = partitionWordList(wordIdList, wordIdToRawWord);
Object.keys(nameToWordIdPartition).forEach(partitionName => {
  const partitionWordIds = nameToWordIdPartition[partitionName];
  const wordData = createWordDataForPartition(partitionWordIds, wordIdToWordExport);

  // Generate partition file names.
  const wordDataFilePath = `${wordsDataPathPrefix}${partitionName}.json`;
  const spellingsFilePath = `${spellingsToWordIdsPathPrefix}${partitionName}.json`;

  // Write out partition data.
  fs.writeFileSync(wordDataFilePath, JSON.stringify(wordData, null, 2));

  // Write spelling → word UUID lookup for this partition.
  const spellingToWordId: Record<string, string> = {};
  partitionWordIds.forEach(wordId => {
    wordIdToRawWord[wordId].spellings.forEach(spelling => {
      spellingToWordId[spelling] = wordId;
    });
  });
  fs.writeFileSync(spellingsFilePath, JSON.stringify(spellingToWordId, null, 2));
});

// Write thesaurus words that have no matching dictionary entry for manual review.
fs.writeFileSync('./output/unresolvedThesaurusWords.json', JSON.stringify(Array.from(unresolvedThesaurusWords).sort(), null, 2));

// fs.writeFileSync(partsOfSpeechLookupPath, JSON.stringify(partOfSpeechToWordIds, null, 2));

// Write out the final word data in big files.
// Note: this is useful for debugging, but not so useful for working with the data in the cloud.
// fs.writeFileSync(wordsDataPath, JSON.stringify(Object.values(wordIdToWord), null, 2));
// fs.writeFileSync(wordsReferencesPath, JSON.stringify(Object.values(wordIdToWordReferences), null, 2));
// fs.writeFileSync(wordsListPath, JSON.stringify(wordIdList, null, 2));
