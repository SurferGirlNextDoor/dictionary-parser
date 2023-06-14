# Dictionary

Provides scripts to parse a dictionary in order to programmatically explore words and definitions.

## Dictionary source

The dictionary is free from the Gutenberg project: https://www.gutenberg.org/cache/epub/29765/pg29765.txt

## The parsing process approach

The dictionary is first cleaned, and its characters are verified to include a fixed set.

Then the words are parsed, using 2 different regex patterns, one to find just the words, and one to find the words and their content.  The word lists from these 2 passes must match to validate that the regex parse patterns are correct.

After the parsing is complete, 2 output files are generated:

`output\wordList.json` and `output\wordData.json`

The schema for the word data includes the spelling of the word at the top level and then a variants list that contains the raw data for the variant, the pronunciation/etymology section, and the definition section.  For example:

```
  "RHYME": {
    "spelling": "RHYME",
    "variants": [
      {
        "pronunciation": "Rhyme, n. Etym: [OE. ryme, rime, AS. rim number; akin to OHG. rim\nnumber, succession, series, G. reim rhyme. The modern sense is due to\nthe influence of F. rime, which is of German origin, and originally\nthe same word.] [The Old English spelling rime is becoming again\ncommon. See Note under Prime.]",
        "definitionSection": "1. An expression of thought in numbers, measure, or verse; a\ncomposition in verse; a rhymed tale; poetry; harmony of language.\n\"Railing rhymes.\" Daniel.\nA ryme I learned long ago. Chaucer.\nHe knew Himself to sing, and build the lofty rime. Milton.\n\n2. (Pros.)\n\nDefn: Correspondence of sound in the terminating words or syllables\nof two or more verses, one succeeding another immediately or at no\ngreat distance. The words or syllables so used must not begin with\nthe same consonant, or if one begins with a vowel the other must\nbegin with a consonant. The vowel sounds and accents must be the\nsame, as also the sounds of the final consonants if there be any.\nFor rhyme with reason may dispense, And sound has right to govern\nsense. Prior.\n\n3. Verses, usually two, having this correspondence with each other; a\ncouplet; a poem containing rhymes.\n\n4. A word answering in sound to another word. Female rhyme. See under\nFemale.\n -- Male rhyme. See under Male.\n -- Rhyme or reason, sound or sense.\n -- Rhyme royal (Pros.), a stanza of seven decasyllabic verses, of\nwhich the first and third, the second, fourth, and fifth, and the\nsixth and seventh rhyme.",
        "rawData": "RHYME\nRhyme, n. Etym: [OE. ryme, rime, AS. rim number; akin to OHG. rim\nnumber, succession, series, G. reim rhyme. The modern sense is due to\nthe influence of F. rime, which is of German origin, and originally\nthe same word.] [The Old English spelling rime is becoming again\ncommon. See Note under Prime.]\n\n1. An expression of thought in numbers, measure, or verse; a\ncomposition in verse; a rhymed tale; poetry; harmony of language.\n\"Railing rhymes.\" Daniel.\nA ryme I learned long ago. Chaucer.\nHe knew Himself to sing, and build the lofty rime. Milton.\n\n2. (Pros.)\n\nDefn: Correspondence of sound in the terminating words or syllables\nof two or more verses, one succeeding another immediately or at no\ngreat distance. The words or syllables so used must not begin with\nthe same consonant, or if one begins with a vowel the other must\nbegin with a consonant. The vowel sounds and accents must be the\nsame, as also the sounds of the final consonants if there be any.\nFor rhyme with reason may dispense, And sound has right to govern\nsense. Prior.\n\n3. Verses, usually two, having this correspondence with each other; a\ncouplet; a poem containing rhymes.\n\n4. A word answering in sound to another word. Female rhyme. See under\nFemale.\n -- Male rhyme. See under Male.\n -- Rhyme or reason, sound or sense.\n -- Rhyme royal (Pros.), a stanza of seven decasyllabic verses, of\nwhich the first and third, the second, fourth, and fifth, and the\nsixth and seventh rhyme."
      },
      {
        "pronunciation": "Rhyme, v. i. [imp. & p. p. Rhymed;p. pr. & vb. n. Rhyming.] Etym:\n[OE. rimen, rymen, AS. riman to count: cf. F. rimer to rhyme. See\nRhyme, n.]",
        "definitionSection": "1. To make rhymes, or verses. \"Thou shalt no longer ryme.\" Chaucer.\nThere marched the bard and blockhead, side by side, Who rhymed for\nhire, and patronized for pride. Pope.\n\n2. To accord in rhyme or sound.\nAnd, if they rhymed and rattled, all was well. Dryden.",
        "rawData": "RHYME\nRhyme, v. i. [imp. & p. p. Rhymed;p. pr. & vb. n. Rhyming.] Etym:\n[OE. rimen, rymen, AS. riman to count: cf. F. rimer to rhyme. See\nRhyme, n.]\n\n1. To make rhymes, or verses. \"Thou shalt no longer ryme.\" Chaucer.\nThere marched the bard and blockhead, side by side, Who rhymed for\nhire, and patronized for pride. Pope.\n\n2. To accord in rhyme or sound.\nAnd, if they rhymed and rattled, all was well. Dryden."
      },
      {
        "pronunciation": "Rhyme, v. t.",
        "definitionSection": "1. To put into rhyme. Sir T. Wilson.\n\n2. To influence by rhyme.\nHearken to a verser, who may chance Rhyme thee to good. Herbert.",
        "rawData": "RHYME\nRhyme, v. t.\n\n1. To put into rhyme. Sir T. Wilson.\n\n2. To influence by rhyme.\nHearken to a verser, who may chance Rhyme thee to good. Herbert."
      }
    ]
  }
  ```

## Running the parser

To run:

`npm run parse`
