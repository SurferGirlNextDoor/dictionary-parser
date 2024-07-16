export const PARTS_OF_SPEECH = {
  NOUN: 'n.',
  VERB: 'v.',
  VERB_INTRANSITIVE: 'v.i.',
  VERB_TRANSITIVE: 'v.t.',
  ADVERB: 'adv.',
  ADJECTIVE: 'adj.',
  PREPOSITION: 'prep.',
  PRESENT_PARTICIPLE: 'p.pr.',
  PAST_PARTICIPLE: 'p.p.',
  INTERJECTION: 'interj.',
  CONJUGATION: 'conj.',
  IMPERATIVE: 'imp.'
};

export interface RawWordDataResult {
  wordIdToRawWord: Record<string, WordDataRaw>;
  wordIdList: string[];
}

export interface WordDataRaw {
  id: string;
  spellingsString: string;
  spellings: string[];
  variants: WordVariantRaw[];
}

export interface WordVariantRaw {
  rawData: string;
  pronunciation: string;
  definitionSection: string;
}

export interface WordData {
  id: string;
  spellingsString: string;
  spellings: string[];
  variants: WordVariant[];
}

// Some words:
// A
// ALSO
// AN
// AND
// ANY
// ARE
// AS
// AT
// BE
// BEING
// BY
// FOR
// FROM
// HAVING
// IN
// IS
// IT
// NOT
// OF
// ON
// ONE
// OR
// SEE
// THAT
// THE
// TO
// WHICH
// WHO
// WITH
// reference so many words that their word reference list
// is both very large and not useful, so we don't store all their words.
export interface WordReferenceData {
  wordId: string;
  referenceWordIds: string[];
  hasMoreThan5000References?: boolean;
}

export interface WordVariant {
  rawData: string;
  pronunciation: string;
  partsOfSpeech?: string[];
  definitions: string[];
  synonyms?: string[];
  notes?: string[];
  examples?: string[];
  others?: string[]
  isArchaic?: boolean;
  isObsolete?: boolean;
}

export interface WordDisplayData {
  wordId: string;
  spellingsString: string;
  variants: WordDisplayVariant[];
  hasReferences?: boolean;
}

export interface WordDisplayVariant {
  rawData: string;
  partsOfSpeech?: string[];
  isArchaic?: boolean;
  isObsolete?: boolean;
}
