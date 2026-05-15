import { WordDataRaw } from './wordDataTypes';

const partitionSplitThreshold = 1000;
const validFirstLetterRegex = /^[A-Z]$/;


function getFirstLetter(spelling: string, currentFirstLetter: string): string {
  const firstLetter = spelling.charAt(0);

  // Don't update the letter batch if the spelling starts with '-'
  if (validFirstLetterRegex.test(firstLetter)) {
    return firstLetter;
  }

  return currentFirstLetter;
}

export function partitionWordList(wordIdList: string[], wordIdToRawWord: Record<string, WordDataRaw>): {[index: string]: string[]} {
  let currentFirstLetter = 'A';
  let nameToWordIdPartition: {[index: string]: string[]} = {};
  let currentPartition: string[] = [];
  let letterPartitionCount: {[letter: string]: number} = {};

  function flushPartition(letter: string) {
    if (currentPartition.length === 0) return;

    letterPartitionCount[letter] = (letterPartitionCount[letter] || 0) + 1;
    const count = letterPartitionCount[letter];
    const partitionName = count === 1 ? letter : `${letter}${count}`;
    nameToWordIdPartition[partitionName] = currentPartition;
    currentPartition = [];
  }

  wordIdList.forEach(wordId => {
    const spelling = wordIdToRawWord[wordId].spellingsString;
    const firstLetter = getFirstLetter(spelling, currentFirstLetter);

    if (firstLetter !== currentFirstLetter) {
      flushPartition(currentFirstLetter);
      currentFirstLetter = firstLetter;
    } else if (currentPartition.length >= partitionSplitThreshold) {
      flushPartition(currentFirstLetter);
    }

    currentPartition.push(wordId);
  });

  flushPartition(currentFirstLetter);

  // Visually inspect the partition breakdown:
  Object.keys(nameToWordIdPartition).forEach(partitionName => {
    console.log(`${partitionName}: ${nameToWordIdPartition[partitionName].length}`);
  });

  return nameToWordIdPartition;
}
