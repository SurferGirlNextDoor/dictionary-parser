const partitionSplitThreshold = 4000;
const validFirstLetterRegex = /^[A-Z]$/;


function getFirstLetter(wordId: string, currentFirstLetter: string): string {
  const firstLetter = wordId.charAt(0);

  // Don't update the letter batch if the letter starts with '-'
  if (validFirstLetterRegex.test(firstLetter)) {
    return firstLetter;
  }

  return currentFirstLetter;
}

function generatePartitionName(startLetter: string, endLetter: string): string {
  if (startLetter === endLetter) {
    return startLetter;
  }
  return `${startLetter}-${endLetter}`;
}

export function partitionWordList(wordIdList: string[]): {[index: string]: string[]} {
  let currentPartitionStartLetter = 'A';
  let currentFirstLetter = 'A';
  let nameToWordIdPartition: {[index: string]: string[]} = {};
  let currentPartition: string[] = [];

  wordIdList.forEach(wordId => {
    const firstLetter = getFirstLetter(wordId, currentFirstLetter);

    // If the first letter changed, consider moving the next word list to a new partition.
    // Since the current partition is done,
    // assign it a name and add it to the map we will return.
    if (firstLetter !== currentFirstLetter) {
      if (currentPartition.length > partitionSplitThreshold) {
        const partitionName = generatePartitionName(currentPartitionStartLetter, currentFirstLetter);
        nameToWordIdPartition[partitionName] = currentPartition;
        currentPartitionStartLetter = firstLetter;
        currentPartition = [];
      }
    }

    currentFirstLetter = firstLetter;
    currentPartition.push(wordId);
  });

  // Add the last partition.
  const finalPartitionName = generatePartitionName(currentPartitionStartLetter, currentFirstLetter);
  nameToWordIdPartition[finalPartitionName] = currentPartition;

  // Visually inspect the partition breakdown:
  Object.keys(nameToWordIdPartition).forEach(partitionName => {
    console.log(`${partitionName}: ${nameToWordIdPartition[partitionName].length}`);
  });

  return nameToWordIdPartition;
}
