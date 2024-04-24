import { PARTS_OF_SPEECH } from "./wordDataTypes";

export interface PartOfSpeechParseResult {
  partsOfSpeech: string[];
  isObsolete: boolean;
  isArchaic: boolean;
}

const pronunciationSectionPattern = `^(?<definitelyPronunciation>[^ ,]*)(?<maybePartOfSpeech>.*?)(?<etymology>Etym.*)?$`;

const nounRegex = /(n[.]|n [.]| n[,]|n[ ]*$|n[;] pl)/;
const verbRegex = /v[.]/;
const verbIntransitiveRegex = /(v[.]i[.]|v[.] i[.])/;
const verbTransitiveRegex = /(v[.]t[.]|v[.] t[.])/;
const adverbRegex = /adv[.]/;
const adjectiveRegex = /(a[.]| a[ ]*$|adj[.])/;
const prepositionRegex = /prep[.]/;
const presentParticipleRegex = /(p[.]pr[.]|p[.] pr[.])/;
const pastParticipleRegex = /(p[.]p[.]|p[.] p[.])/;
const interjectionRegex = /interj[.]/;
const conjugationRegex = /conj[.]/;
const imperativeRegex = /imp[.]/;
const obsoleteRegex = /obs[.]/;
const archaicRegex = /archaic/;

function parsePartsOfSpeechSection(spelling: string, maybePartOfSpeech: string): PartOfSpeechParseResult | null {
  const partsOfSpeech: string[] = [];

  const isNoun = nounRegex.test(maybePartOfSpeech);
  if (isNoun) {
    partsOfSpeech.push(PARTS_OF_SPEECH.NOUN);
  }

  const isVerb = verbRegex.test(maybePartOfSpeech);
  if (isVerb) {
    partsOfSpeech.push(PARTS_OF_SPEECH.VERB);
  }

  const isIntransitiveVerb = verbIntransitiveRegex.test(maybePartOfSpeech);
  if (isIntransitiveVerb) {
    partsOfSpeech.push(PARTS_OF_SPEECH.VERB_INTRANSITIVE);
  }

  const isTransitiveVerb = verbTransitiveRegex.test(maybePartOfSpeech);
  if (isTransitiveVerb) {
    partsOfSpeech.push(PARTS_OF_SPEECH.VERB_TRANSITIVE);
  }

  const isAdverb = adverbRegex.test(maybePartOfSpeech);
  if (isAdverb) {
    partsOfSpeech.push(PARTS_OF_SPEECH.ADVERB);
  }

  const isAdjective = adjectiveRegex.test(maybePartOfSpeech);
  if (isAdjective) {
    partsOfSpeech.push(PARTS_OF_SPEECH.ADJECTIVE);
  }

  const isPreposition = prepositionRegex.test(maybePartOfSpeech);
  if (isPreposition) {
    partsOfSpeech.push(PARTS_OF_SPEECH.PREPOSITION);
  }

  const isPresentParticiple = presentParticipleRegex.test(maybePartOfSpeech);
  if (isPresentParticiple) {
    partsOfSpeech.push(PARTS_OF_SPEECH.PRESENT_PARTICIPLE);
  }

  const isPastParticiple = pastParticipleRegex.test(maybePartOfSpeech);
  if (isPastParticiple) {
    partsOfSpeech.push(PARTS_OF_SPEECH.PAST_PARTICIPLE);
  }

  const isInterjection = interjectionRegex.test(maybePartOfSpeech);
  if (isInterjection) {
    partsOfSpeech.push(PARTS_OF_SPEECH.INTERJECTION);
  }

  const isConjugation = conjugationRegex.test(maybePartOfSpeech);
  if (isConjugation) {
    partsOfSpeech.push(PARTS_OF_SPEECH.CONJUGATION);
  }

  const isImperative = imperativeRegex.test(maybePartOfSpeech);
  if (isImperative) {
    partsOfSpeech.push(PARTS_OF_SPEECH.IMPERATIVE);
  }

  const isObsolete = obsoleteRegex.test(maybePartOfSpeech);
  const isArchaic = archaicRegex.test(maybePartOfSpeech);
  if (partsOfSpeech.length === 0  && !isArchaic && !isObsolete) {
    return null;
  }

  return {
    partsOfSpeech,
    isArchaic,
    isObsolete
  };
}

export function parsePartsOfSpeech(spelling: string, pronunciation: string): PartOfSpeechParseResult | null {
  // Make sure the section has the expected format.
  const pronunciationSectionRegex = new RegExp(pronunciationSectionPattern, 'mg');
  const result = pronunciationSectionRegex.exec(pronunciation);
  if (!result) {
    console.log(`not a match: ${pronunciation}`);
    throw new Error();
  }

  // Check that the pronunciation section has a pronunciation.
  const definitelyPronunciation = result.groups?.definitelyPronunciation;
  if (!definitelyPronunciation) {
    console.log(spelling);
    console.log('should have pronunciation', pronunciation);
    throw new Error();
  }

  // Find the part of the section that is not pronunciation and not etymology,
  // and this might contain the parts of speech.
  const maybePartOfSpeech = result.groups?.maybePartOfSpeech?.trim();
  if (!maybePartOfSpeech){
    return null;
  }

  return parsePartsOfSpeechSection(spelling, maybePartOfSpeech);
}
