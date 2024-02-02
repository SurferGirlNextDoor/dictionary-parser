interface RawWordDataResult {
  wordsRaw: Record<string, WordDataRaw>;
  wordList: string[];
}

interface WordDataRaw {
  spelling: string;
  variants: WordVariantRaw[];
}

interface WordVariantRaw {
  rawData: string;
  pronunciation: string;
  definitionSection: string;
}

interface WordData {
  spelling: string;
  variants: WordVariant[];
  wordsThatReferenceThisWord: string[];
}

interface WordVariant {
  rawData: string;
  pronunciation: string;
  definitions: string[];
  synonyms?: string[];
  notes?: string[];
  examples?: string[];
  others?: string[]
}
