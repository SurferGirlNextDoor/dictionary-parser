import { parseDefinition } from './parseDefinition';
import { populateReverseLookupForWordVariant } from './createReverseLookup';
import { PhraseWordLookups, buildPhraseWordLookups } from './buildPhraseWordLookups';
import { lookupAbbreviation, extractEtymLanguages } from './abbreviationLookup';
import { SectionExport, VariantExport, WordData, WordDataRaw, WordExportData, WordToken, WordVariantRaw } from './wordDataTypes';

const referenceBatchSize = 500;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function getWordInfoForWordIds(spellings: string, wordIds: string[], wordIdToRawWord: Record<string, WordDataRaw>): string[] {
  const references: Set<string> = new Set();

  wordIds.forEach(wordId => {
    const rawWord = wordIdToRawWord[wordId];
    if (references.has(rawWord.spellingsString)) {
      throw new Error(`duplicate ${rawWord.spellingsString}`);
    }

    if (rawWord.spellingsString === spellings) {
      // Don't add a reference for a word to itself.
      return;
    }

    references.add(rawWord.spellingsString);
  });

  const uniqueReferences = Array.from(references.keys());

  return uniqueReferences;
}

// Split the pronunciation field into the actual pronunciation line and the etymology.
// Etym: may appear inline on the first line or on subsequent lines.
function extractEtym(pronunciation: string): { pron: string; etym?: string } {
  const etymIndex = pronunciation.indexOf('Etym:');
  if (etymIndex < 0) return { pron: pronunciation };
  return {
    pron: pronunciation.substring(0, etymIndex).trim(),
    etym: pronunciation.substring(etymIndex + 'Etym:'.length).trim(),
  };
}

// Try to find a dictionary word ID for an inflected form that doesn't have an exact match.
// Tries common English inflection patterns in order of specificity.
function findInflectedWordId(word: string, loweredWordToWordId: Map<string, string>): string | undefined {
  const lookup = (w: string) => loweredWordToWordId.get(w);

  // possessive: word's -> word
  if (word.endsWith("'s") && word.length > 3) {
    const id = lookup(word.slice(0, -2));
    if (id) return id;
  }

  // -ies -> -y plural (berries -> berry)
  if (word.endsWith('ies') && word.length > 4) {
    const id = lookup(word.slice(0, -3) + 'y');
    if (id) return id;
  }

  // -es plural (fishes -> fish, foxes -> fox)
  if (word.endsWith('es') && word.length > 4) {
    const id = lookup(word.slice(0, -2));
    if (id) return id;
  }

  // -s plural (parts -> part, words -> word)
  if (word.endsWith('s') && word.length > 3) {
    const id = lookup(word.slice(0, -1));
    if (id) return id;
  }

  // -ing -> base (pertaining -> pertain, containing -> contain)
  if (word.endsWith('ing') && word.length > 5) {
    const id = lookup(word.slice(0, -3));
    if (id) return id;
  }

  // -ing -> base + e (resembling -> resemble, using -> use)
  if (word.endsWith('ing') && word.length > 5) {
    const id = lookup(word.slice(0, -3) + 'e');
    if (id) return id;
  }

  // -ing with doubled consonant (running -> run, sitting -> sit)
  if (word.endsWith('ing') && word.length > 6) {
    const id = lookup(word.slice(0, -4));
    if (id) return id;
  }

  // -ed -> base (called -> call, obtained -> obtain)
  if (word.endsWith('ed') && word.length > 4) {
    const id = lookup(word.slice(0, -2));
    if (id) return id;
  }

  // -d -> base with e (opposed -> oppose, placed -> place, produced -> produce)
  if (word.endsWith('d') && word.length > 3) {
    const id = lookup(word.slice(0, -1));
    if (id) return id;
  }

  // -ed with doubled consonant (dropped -> drop)
  if (word.endsWith('ed') && word.length > 5) {
    const id = lookup(word.slice(0, -3));
    if (id) return id;
  }

  // -er comparative (kinder -> kind)
  if (word.endsWith('er') && word.length > 4) {
    const id = lookup(word.slice(0, -2));
    if (id) return id;
  }

  // -er comparative with e (wider -> wide)
  if (word.endsWith('er') && word.length > 4) {
    const id = lookup(word.slice(0, -2) + 'e');
    if (id) return id;
  }

  return undefined;
}

// Tokenize text into words (with optional id lookup), digits, and punctuation/symbols.
// Words preserve their original case; id is set when the word exists in the dictionary.
// Non-alphabetic, non-whitespace characters are emitted as symbol tokens with no id.
function tokenizeText(text: string, loweredWordToWordId: Map<string, string>): WordToken[] {
  const tokens: WordToken[] = [];
  // Matches: multi-char word, single letter, digit run, or single non-whitespace symbol
  const tokenRegex = /[a-zA-Z][a-zA-Z'-]*[a-zA-Z]|[a-zA-Z]|\d+|[^\s\w]/g;
  let match;
  while ((match = tokenRegex.exec(text)) !== null) {
    const tokenText = match[0];
    if (/^[a-zA-Z]/.test(tokenText)) {
      const original = tokenText.replace(/^['-]+|['-]+$/g, '');
      const cleaned = original.toLowerCase();
      const id = loweredWordToWordId.get(cleaned)
        ?? lookupAbbreviation(original, loweredWordToWordId)
        ?? findInflectedWordId(cleaned, loweredWordToWordId);
      const token: WordToken = { text: tokenText };
      if (id) token.id = id;
      tokens.push(token);
    } else {
      tokens.push({ text: tokenText });
    }
  }
  return tokens;
}

function buildVariantExport(rawVariant: WordVariantRaw, parsedVariant: WordData['variants'][number], loweredWordToWordId: Map<string, string>): VariantExport {
  const { pron, etym } = extractEtym(rawVariant.pronunciation);

  const sections: SectionExport[] = [];

  if (etym) {
    sections.push({ type: 'etym', marker: 'Etym:', text: etym, words: tokenizeText(etym, loweredWordToWordId) });
  }

  for (const section of parsedVariant.sections) {
    const exported: SectionExport = {
      type: section.type,
      text: section.text,
      words: tokenizeText(section.text, loweredWordToWordId),
    };
    if (section.marker) exported.marker = section.marker;
    sections.push(exported);
  }

  const etymLanguages = etym ? extractEtymLanguages(etym) : [];

  const result: VariantExport = { pronunciation: pron, sections };
  if (parsedVariant.partsOfSpeech?.length) result.partsOfSpeech = parsedVariant.partsOfSpeech;
  if (parsedVariant.isArchaic) result.isArchaic = true;
  if (parsedVariant.isObsolete) result.isObsolete = true;
  if (etymLanguages.length) result.etymLanguages = etymLanguages;
  return result;
}

export function parseWords(wordIdToRawWord: Record<string, WordDataRaw>, wordIdList: string[]): {wordIdToWord: {[index: string]: WordData}, wordIdToWordExport: {[index: string]: WordExportData}, unresolvedThesaurusWords: Set<string>} {
  // Find the spellings of all the available words, including words with spaces,
  // and populate a lookup based on word id for all available words.
  const phraseWordLookups: PhraseWordLookups = buildPhraseWordLookups(wordIdList, wordIdToRawWord);

  // Process each word into its variant definitions,
  // populating a reverse lookup as we go through each definition.
  const wordIdToWord: {[index: string]: WordData} = {};
  const wordIdToReferenceWordIds: Map<string, Map<string, boolean>> = new Map();

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
  const wordIdToWordExport: {[index: string]: WordExportData} = {};
  const unresolvedThesaurusWords = new Set<string>();

  // Find words that reference this word.
  wordIdList.forEach(wordId => {
    const rawWord = wordIdToRawWord[wordId];
    const parsedWord = wordIdToWord[wordId];
    const referenceWordIds: string[] = Array.from(wordIdToReferenceWordIds.get(wordId)?.keys() || []);
    if (referenceWordIds) {
      const references = getWordInfoForWordIds(rawWord.spellingsString, referenceWordIds, wordIdToRawWord);

      const variants: VariantExport[] = rawWord.variants.map((rawVariant, i) =>
        buildVariantExport(rawVariant, parsedWord.variants[i], phraseWordLookups.loweredWordToWordId)
      );

      const thesaurusSpellingsSeen = new Set<string>();
      const thesaurusTokens: WordToken[] = [];
      parsedWord.variants.forEach(variant => {
        (variant.thesaurusWords || []).forEach(word => {
          const lowered = word.toLowerCase();
          if (!thesaurusSpellingsSeen.has(lowered)) {
            thesaurusSpellingsSeen.add(lowered);
            const id = phraseWordLookups.loweredWordToWordId.get(lowered)
              ?? findInflectedWordId(lowered, phraseWordLookups.loweredWordToWordId);
            const token: WordToken = { text: word };
            if (id) {
              token.id = id;
            } else {
              unresolvedThesaurusWords.add(lowered);
            }
            thesaurusTokens.push(token);
          }
        });
      });

      const wordIsArchaic = parsedWord.variants.some(v => v.isArchaic);
      const wordIsObsolete = parsedWord.variants.some(v => v.isObsolete);

      wordIdToWordExport[wordId] = {
        spellings: rawWord.spellingsString,
        ...(wordIsArchaic && { isArchaic: true }),
        ...(wordIsObsolete && { isObsolete: true }),
        componentId: 0, // populated after computeComponents runs in index.ts
        variants,
        ...(thesaurusTokens.length > 0 && { thesaurusWords: thesaurusTokens }),
        referenceCount: references.length,
        references: chunkArray(references, referenceBatchSize),
      }
    }
  });

  return {
    wordIdToWord,
    wordIdToWordExport,
    unresolvedThesaurusWords,
  };
}
