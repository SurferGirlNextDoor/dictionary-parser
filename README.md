# Dictionary Parser

Parses the [Project Gutenberg Webster's Unabridged Dictionary](https://www.gutenberg.org/cache/epub/29765/pg29765.txt) into structured JSON files suitable for loading into a database.

## Running the parser

```sh
npm run parse
```

Output is written to the `output/` directory.

---

## Output files

### `wordDisplayData#<partition>.json`

The primary word data, partitioned by first letter of the spelling (e.g. `wordDisplayData#A.json`, `wordDisplayData#B-D.json`). Each file is an array of word objects.

**Word object schema:**

```ts
{
  spellings: string;          // all spellings joined by "; " (e.g. "MOUSE; MICE")
  variants: Variant[];        // one entry per dictionary variant/sense block
  thesaurusWords?: WordToken[]; // resolved thesaurus entries (see below)
  references: string[][];     // spellings of words that reference this word,
                              // chunked into arrays of ≤500
}
```

**Variant schema:**

```ts
{
  pronunciation: string;  // pronunciation / part-of-speech line
  sections: Section[];    // ordered definition sections
}
```

**Section schema:**

```ts
{
  type: 'etym' | 'defn' | 'numbered' | 'lettered' | 'suffix'
      | 'syn' | 'note' | 'other' | 'example' | 'unlabeled';
  marker?: string;    // e.g. "Defn:", "1.", "(a)", "Syn."
  text: string;       // section text with the marker stripped
  words: WordToken[]; // every token in `text`, in order (see below)
}
```

**WordToken schema:**

```ts
{
  text: string;   // original text of the token (preserves capitalisation)
  id?: string;    // UUID v7 of the matching dictionary word, if resolved
}
```

`words` covers every token in the section text — alphabetic words, digits, and punctuation symbols. Only alphabetic tokens carry an `id`. Tokens with no `id` are either punctuation/digits or words not found in the dictionary (including common function words such as "the", "of", "is").

---

### `spellingsToWordIds#<partition>.json`

A flat object mapping each individual spelling to the word's UUID. Use this to resolve a spelling to an ID before fetching the full word record.

```json
{
  "ABBEY": "0191b7f0-0000-7a3c-91d0-4f2e8b1c6d7a",
  "ABBEYS": "0191b7f0-0001-7b1f-8e22-3c9d0a5f4b2c",
  "ABBOT": "0191b7f0-0002-7c44-9f3a-1d8e2b6a5c7f"
}
```

Keys are all-caps spellings exactly as they appear in the dictionary. A word with multiple spellings (e.g. `"MOUSE; MICE"`) has one entry per spelling, both pointing to the same UUID.

Partitioned by the same letter ranges as `wordDisplayData`.

---

### `unresolvedThesaurusWords.json`

A sorted array of lowercase thesaurus entries that could not be matched to any dictionary word (including inflected-form fallbacks). Useful for auditing coverage.

```json
[
  "alpha and omega",
  "bonne bouche",
  ...
]
```

---

## Word IDs

Word IDs are **UUID v7**. UUID v7 embeds a millisecond-precision Unix timestamp in the high 48 bits, which makes IDs lexicographically sortable — the standard approach for ordering records by insertion time in DynamoDB.

The timestamp starts at `2024-01-01T00:00:00.000Z` and increments by 1 ms per word, so IDs sort in the same order that words appear in the dictionary (alphabetical order of the source text). Sorting word IDs lexicographically reproduces dictionary order.

---

## Thesaurus words

`thesaurusWords` on a word object is an array of `WordToken` entries, one per unique synonym entry extracted from the word's `Syn.` section(s).

```json
"thesaurusWords": [
  { "text": "Profligate", "id": "0191b7f0-1234-7a3c-..." },
  { "text": "dissolute",  "id": "0191b7f0-5678-7b1f-..." },
  { "text": "corrupt",    "id": "0191b7f0-9abc-7c44-..." },
  { "text": "bonne bouche" }
]
```

- `text` preserves the capitalisation as it appears in the source thesaurus list.
- `id` is present when the spelling was matched to a dictionary entry (including common inflected forms). When absent, the word also appears in `unresolvedThesaurusWords.json`.
- Multi-word phrases (e.g. `"give up"`) are matched against phrase entries in the dictionary.

---

## Looking up a word by spelling

1. Determine which partition covers the first letter of the spelling.
2. Fetch `spellingsToWordIds#<partition>.json` and look up the spelling (uppercase) to get the UUID.
3. Fetch `wordDisplayData#<partition>.json` and find the entry whose implicit array index corresponds to the UUID — or store by UUID in your database on import.
