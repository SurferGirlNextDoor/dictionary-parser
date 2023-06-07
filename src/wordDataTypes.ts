interface RawWordDataResult {
  words: Record<string, WordData>;
  wordList: string[];
}

interface WordData {
  spelling: string;
  variants: WordVariant[];
}

interface WordVariant {
  pronunciation: string;
  definitionSection: string;
  rawData: string;
}
