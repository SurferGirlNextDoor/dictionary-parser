const findAllowedCharactersRegex = /^[\sA-Za-z\s;:\-(),ãäâáàåæÆëéèêÉïíîìöòóôðüÜúùûñçÇÞþý.½¼¾º°@§0-9"'=`~^!¿#\&[\]{}*+÷×/\\|_£$%<>]*(?<nextNewChars>.*)/gd;
const allowedCharsRegex = /^[\sA-Za-z\s;:\-(),ãäâáàåæÆëéèêÉïíîìöòóôðüÜúùûñçÇÞþý.½¼¾º°@§0-9"'=`~^!¿#\&[\]{}*+÷×/\\|_£$%<>]*$/gdm;

export function cleanCharacters(text: string): string {
  // Replace all newlines to be consistently `\n`.
  const newlineCleanedText = text.replace(/\r\n/g, '\n').trim();

  // Make sure we only have allowed characters.
  // const charsResult = allowedCharsRegex.exec(newlineCleanedText);
  // console.log('NEXT: ', charsResult?.groups?.nextNewChars)
  // console.log(`${(charsResult as any)?.indices} out of ${newlineCleanedText.length.toLocaleString()}`);

  if (!allowedCharsRegex.test(newlineCleanedText)) {
    throw new Error(`Found invalid characters in text`);
  }

  return newlineCleanedText;
}
