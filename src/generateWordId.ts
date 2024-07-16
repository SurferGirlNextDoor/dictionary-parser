
const wordIdPrefix = 'WORD#';
const wordIdSeparatorReplacementRegex = /[;][ ]*/g;
const wordIdRemovalRegex = /[,]/g;
const wordIdReplacementRegex = /[ '.]/g;
const wordIdSpellingRegex = /^[A-Z-][A-Z1_-]*$/;

// This is optimized to be as short as possible and maintain uniqueness.
const maxWordIdSpellingLength = 24;

const wordIdSuffixToSpellingsString: Map<string, string> = new Map();

/**
 * Produces a sortable, database friendly word id that is shorter in length than
 * a standard uuid but still unique across the fixed data set of the webster's words
 * that are being parsed.
 */
export function generateWordId(spellingsString: string) {
  // Clean the funky characters from the spelling before we use it for the id
  // so the id will be database key friendly.
  // Use the spelling so that the id can be sorted more easily.
  const wordIdSuffix = spellingsString.replace(wordIdSeparatorReplacementRegex, '__').replace(wordIdRemovalRegex, '').replace(wordIdReplacementRegex, '_').substring(0, maxWordIdSpellingLength);
  if (!wordIdSpellingRegex.test(wordIdSuffix)) {
    throw new Error(`Invalid word id suffix: ${wordIdSuffix} from ${spellingsString}`);
  }

  // Make sure the id will be unique.
  if (wordIdSuffixToSpellingsString.has(wordIdSuffix)) {
    throw new Error(`Duplicate word id suffix: ${wordIdSuffix} from ${wordIdSuffixToSpellingsString.get(wordIdSuffix)} and ${spellingsString}`);
  }
  wordIdSuffixToSpellingsString.set(wordIdSuffix, spellingsString);

  // Generate the word id
  return `${wordIdPrefix}${wordIdSuffix}`;
}
