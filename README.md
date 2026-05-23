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
  spellings: string;            // all spellings joined by "; " (e.g. "MOUSE; MICE")
  isArchaic?: true;             // present when every variant is marked archaic
  isObsolete?: true;            // present when any variant is marked obsolete
  componentId: number;          // connected-component label (see below)
  variants: Variant[];          // one entry per dictionary variant/sense block
  thesaurusWords?: WordToken[]; // resolved thesaurus entries (see below)
  referenceCount: number;       // total number of other words whose definitions
                                // mention this word — useful for ranking "connectedness"
  references: string[][];       // spellings of those words, chunked into arrays of ≤500
}
```

`isArchaic` and `isObsolete` are top-level flags so consumers can filter historical words without scanning each variant.

`componentId` is a connected-component label. See the **Connected components** section below for details.

`referenceCount` is a flat integer copy of `references.flat().length`. It lets you sort by "most referenced" without flattening the chunked array. The word "A" has ~70 000 references; most words have fewer than 100.

**Variant schema:**

```ts
{
  pronunciation: string;      // pronunciation / part-of-speech line from the source
  partsOfSpeech?: string[];   // e.g. ["n.", "v.t."] — absent when unparseable
  isArchaic?: true;           // variant is labelled archaic in the source
  isObsolete?: true;          // variant is labelled obs. in the source
  etymLanguages?: string[];   // languages detected in the etymology, e.g. ["Latin", "Greek"]
  sections: Section[];        // ordered definition sections
}
```

`partsOfSpeech` values are the abbreviations from the source dictionary: `n.`, `v.`, `v.t.`, `v.i.`, `adj.`, `adv.`, `prep.`, `conj.`, `interj.`, `p.pr.`, `p.p.`, `imp.`. A variant may carry more than one (e.g. `["v.t.", "v.i."]`).

`etymLanguages` is derived from the etymology section by recognising standard Webster's abbreviations such as `L.` (Latin), `Gr.` (Greek), `AS.` (Anglo-Saxon), `Fr.` (French), `Du.` (Dutch), etc. It is absent when no language abbreviation is detected. Possible values include: Anglo-Saxon, Danish, Dutch, French, Gaelic, Gothic, Greek, Hebrew, Icelandic, Irish, Italian, Japanese, Latin, German, Norwegian, Persian, Portuguese, Provençal, Romance, Russian, Saxon, Sanskrit, Slavonic, Spanish, Swedish, Teutonic, Turkish, Welsh.

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

IDs are **deterministic**: the random portion of each UUID is derived from a SHA-256 hash of the word's spellings string rather than from random bytes. Running the parser multiple times produces identical IDs, so a database built from one run remains valid after a re-parse.

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

### `componentSummary.json`

A summary of the connected-component analysis across the full word graph.

```ts
{
  totalComponents: number;            // how many independent islands exist
  mainComponentId: number;            // always 1 (the component containing "A")
  mainComponentSize: number;          // words in the main component
  componentSizes: [number, number][]; // [componentId, wordCount], sorted largest-first
  isolatedWords: { id: string; spellings: string }[];
                                      // every word outside the main component,
                                      // sorted alphabetically by spellings
}
```

In the current dataset: **59 components total**, with the main component containing **98 802 of the 98 860 words** (>99.9%). The remaining 58 words are each a completely isolated island — they appear in no other word's definition and their own definitions mention no other dictionary words. The full list with word IDs is in `componentSummary.json` under `isolatedWords`.

---

## Connected components

Two words are in the same component if one appears in the other's definition or thesaurus tokens — directly or through any chain of such links. The analysis uses a union-find algorithm and runs over the full ~99 000 word graph in a single pass.

**Component labelling** follows dictionary order. Component 1 is the component containing the word "A" (the first entry). As the word list is walked in order, each new root that hasn't been seen yet gets the next sequential label (2, 3, …). In practice, component 1 is the single giant connected graph; components 2–59 are each a single isolated word.

**The 58 isolated words** are obscure or highly specialised terms whose definitions use no other dictionary words and which are never mentioned in any other definition. The complete list with word IDs is in `output/componentSummary.json` under `isolatedWords`.

**`componentId` on each word object** lets consumers trivially separate the main lexical graph from the isolated islands — filter for `componentId === 1` to work with the fully-connected vocabulary, or filter for `componentId > 1` to find words that exist entirely on their own.

---

## Looking up a word by spelling

1. Determine which partition covers the first letter of the spelling.
2. Fetch `spellingsToWordIds#<partition>.json` and look up the spelling (uppercase) to get the UUID.
3. Fetch `wordDisplayData#<partition>.json` and find the entry by UUID — store words keyed by their UUID on import for O(1) lookup.

---

## Data exploration ideas

The structured fields unlock a range of interesting queries across the ~99 000 word dataset.

**Filter by part of speech** — each variant carries a `partsOfSpeech` array. To find all nouns, filter variants where `partsOfSpeech` includes `"n."`. Words that are both noun and verb will appear in both result sets.

**Filter historical words** — `isArchaic` and `isObsolete` are top-level flags on the word object. Filtering on these gives a clean view of vocabulary that has fallen out of use, or the opposite — words with no such flag give you the "living" lexicon.

**Rank by connectedness** — `referenceCount` counts how many other definitions mention a word. Sorting descending surfaces the most conceptually central words in the dictionary (highly ranked words tend to be foundational nouns and verbs). This works as a rough measure of semantic importance without any NLP.

**Browse by etymology language** — `etymLanguages` on each variant lists the language(s) detected in the etymology section. Querying for `"Latin"` or `"Greek"` reveals the classical roots of English; `"Anglo-Saxon"` shows the Germanic core; `"Arabic"`, `"Japanese"`, `"Turkish"` etc. show borrowings. Words derived from multiple languages are common and make for interesting comparisons.

**Traverse the definition graph** — every token in every `section.words` array carries an `id` when it resolves to a dictionary entry. This forms a directed graph: word A → word B means B appears in A's definition. Combined with `references` (the reverse direction), you can walk the graph in either direction and find clusters of related words without any pre-built ontology.

**Synonym networks** — `thesaurusWords` entries carry `id` pointers to their dictionary entries. Building an adjacency list from these gives a synonym graph that can be explored with standard graph algorithms (shortest path between two words, strongly-connected clusters, etc.).

**Isolate the pure lexicon** — filter on `componentId === 1` to get the 98 802-word main graph and exclude the 58 words that are completely disconnected from the rest of the dictionary. Conversely, the isolated words (componentId > 1) are an interesting collection in themselves: obscure, highly specialised, or possibly erroneous entries that Webster's included but never cross-referenced.
