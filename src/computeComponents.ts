import { WordExportData } from './wordDataTypes';

export interface ComponentSummary {
  totalComponents: number;
  mainComponentId: number;
  mainComponentSize: number;
  // Sorted largest-first: [componentId, wordCount]
  componentSizes: [number, number][];
  // Every word outside the main component, sorted alphabetically by spellings.
  isolatedWords: { id: string; spellings: string }[];
}

function find(parent: Map<string, string>, id: string): string {
  const p = parent.get(id)!;
  if (p !== id) {
    // Path compression
    parent.set(id, find(parent, p));
  }
  return parent.get(id)!;
}

function union(
  parent: Map<string, string>,
  rank: Map<string, number>,
  a: string,
  b: string
) {
  const pa = find(parent, a);
  const pb = find(parent, b);
  if (pa === pb) return;
  const ra = rank.get(pa) ?? 0;
  const rb = rank.get(pb) ?? 0;
  if (ra < rb) {
    parent.set(pa, pb);
  } else if (ra > rb) {
    parent.set(pb, pa);
  } else {
    parent.set(pb, pa);
    rank.set(pa, ra + 1);
  }
}

/**
 * Finds connected components across all words using union-find.
 *
 * Two words are in the same component if one appears in the other's definition
 * or thesaurus tokens (directly or through a chain of such links).
 *
 * Component 1 is the component containing the first word in wordIdList (the
 * word "A"). Remaining components are numbered in the order their first member
 * appears in wordIdList (dictionary order).
 */
export function computeComponents(
  wordIdList: string[],
  wordIdToWordExport: Record<string, WordExportData>
): { wordIdToComponentId: Map<string, number>; summary: ComponentSummary } {
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  for (const id of wordIdList) {
    parent.set(id, id);
    rank.set(id, 0);
  }

  const ensureId = (id: string) => {
    if (!parent.has(id)) {
      parent.set(id, id);
      rank.set(id, 0);
    }
  };

  for (const wordId of wordIdList) {
    const word = wordIdToWordExport[wordId];
    if (!word) continue;

    for (const variant of word.variants) {
      for (const section of variant.sections) {
        for (const token of section.words) {
          if (token.id && token.id !== wordId) {
            ensureId(token.id);
            union(parent, rank, wordId, token.id);
          }
        }
      }
    }

    for (const token of word.thesaurusWords ?? []) {
      if (token.id && token.id !== wordId) {
        ensureId(token.id);
        union(parent, rank, wordId, token.id);
      }
    }
  }

  // Label components in dictionary order; the first word's component gets 1.
  const rootToLabel = new Map<string, number>();
  rootToLabel.set(find(parent, wordIdList[0]), 1);
  let nextLabel = 2;

  const wordIdToComponentId = new Map<string, number>();
  for (const wordId of wordIdList) {
    const root = find(parent, wordId);
    if (!rootToLabel.has(root)) {
      rootToLabel.set(root, nextLabel++);
    }
    wordIdToComponentId.set(wordId, rootToLabel.get(root)!);
  }

  // Tally sizes.
  const sizeMap = new Map<number, number>();
  for (const componentId of wordIdToComponentId.values()) {
    sizeMap.set(componentId, (sizeMap.get(componentId) ?? 0) + 1);
  }

  const componentSizes: [number, number][] = Array.from(sizeMap.entries())
    .sort((a, b) => b[1] - a[1]);

  const mainComponentSize = sizeMap.get(1) ?? 0;

  const isolatedWords = wordIdList
    .filter(id => (wordIdToComponentId.get(id) ?? 0) > 1)
    .map(id => ({ id, spellings: wordIdToWordExport[id].spellings }))
    .sort((a, b) => a.spellings.localeCompare(b.spellings));

  return {
    wordIdToComponentId,
    summary: {
      totalComponents: nextLabel - 1,
      mainComponentId: 1,
      mainComponentSize,
      componentSizes,
      isolatedWords,
    },
  };
}
