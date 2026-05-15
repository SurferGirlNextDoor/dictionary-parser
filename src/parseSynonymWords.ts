
// Extracts the list-style thesaurus words from Syn. sections.
//
// A Syn. section contains one or more `--` delimited blocks. A block is a
// word list (rather than commentary) if the text before its first period
// contains at least one semicolon, e.g.:
//   -- Profligate; dissolute; corrupt; vicious.
//   -- To give up; yield; forego; cede; surrender.
//   -- Monastery; convent; nunnery; priory; cloister. See Cloister.
//
// Commentary blocks like `-- To Abandon, Desert, Forsake. These words agree...`
// use commas (not semicolons) before the first period and are skipped.

export function parseThesaurusWords(synonymSections: string[]): string[] {
  const seen = new Set<string>();
  const thesaurusWords: string[] = [];

  for (const section of synonymSections) {
    // Split into `--` blocks; first element is the `Syn.` header
    const blocks = section.split(/\n -- /);

    for (let i = 1; i < blocks.length; i++) {
      const joinedBlock = blocks[i].replace(/\n/g, ' ').trim();

      // Only take text before the first period to isolate the word list
      const firstPeriod = joinedBlock.indexOf('.');
      const wordListPart = firstPeriod >= 0 ? joinedBlock.substring(0, firstPeriod) : joinedBlock;

      // Skip commentary blocks (no semicolons before first period)
      if (!wordListPart.includes(';')) continue;

      for (const rawWord of wordListPart.split(';')) {
        let word = rawWord.trim();

        // Strip "To " prefix on verb list entries
        if (word.startsWith('To ')) {
          word = word.substring(3).trim();
        }

        // Normalize internal whitespace
        word = word.replace(/\s+/g, ' ');

        if (word && !seen.has(word.toLowerCase())) {
          seen.add(word.toLowerCase());
          thesaurusWords.push(word);
        }
      }
    }
  }

  return thesaurusWords;
}
