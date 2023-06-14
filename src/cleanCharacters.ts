// Regex used to find allowed characters (now that we found them all, use the allowedCharsRegex below for validation).
const findAllowedCharactersRegex = /^[\sA-Za-z\s;:\-(),ãäâáàåæÆëéèêÉïíîìöòóôðüÜúùûñçÇÞþý.½¼¾º°@§0-9"'=`~^!¿#\&[\]{}*+÷×/\\|_£$%<>]*(?<nextNewChars>.*)/gd;
const allowedCharsRegex = /^[\sA-Za-z\s;:\-(),ãäâáàåæÆëéèêÉïíîìöòóôðüÜúùûñçÇÞþý.½¼¾º°@§0-9"'=`~^!¿#\&[\]{}*+÷×/\\|_£$%<>]*$/gdm;

export function cleanCharacters(text: string): string {
  // Replace all newlines to be consistently `\n`.
  const newlineCleanedText = text.replace(/\r\n/g, '\n').trim();

  // Process to check for more unexpected characters to 
  // make sure we only have allowed characters.
  // Now that we've found all the possible characters in the file, we don't need to run this each time.
  // const charsResult = allowedCharsRegex.exec(newlineCleanedText);
  // console.log('NEXT: ', charsResult?.groups?.nextNewChars)
  // console.log(`${(charsResult as any)?.indices} out of ${newlineCleanedText.length.toLocaleString()}`);

  // Validate the expected characters in the file.
  if (!allowedCharsRegex.test(newlineCleanedText)) {
    throw new Error(`Found invalid characters in text`);
  }

  return newlineCleanedText;
}
