# Dictionary

Provides scripts to parse a dictionary in order to programmatically explore words and definitions.

## Dictionary source

The dictionary is free from the The Gutenberg Project: [The Project Gutenberg eBook of Webster's Unabridged Dictionary](https://www.gutenberg.org/cache/epub/29765/pg29765.txt)

## The parsing process approach

The dictionary is first cleaned, and its characters are verified to include a fixed set.

Then the words are parsed, using 2 different regex patterns, one to find just the words, and one to find the words and their content.  The word lists from these 2 passes must match to validate that the regex parse patterns are correct.

After the parsing is complete, 3 output files are generated:

`output\wordIdList.json`, `output\wordData.json`, and `output\wordReferences.json`

The schema for the word data includes the spelling of the word at the top level and then a variants list that contains the raw data for the variant, the pronunciation/etymology section, and the definition section. 

## Running the parser

To run:

`npm run parse`

## Uploading the data to the cloud

The `push.yml` file will upload the latest word data to S3 when the code is pushed to the `main` branch.  From there, it can be imported into the database.
