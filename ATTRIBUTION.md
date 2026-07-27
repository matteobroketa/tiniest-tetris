# Attribution and modification notice

## Scripted simulator lineage

The files under `candidates/scripted/` are adaptations of the Python answer headed **“Python, 298 chars”** in:

- **Work:** “Code Golf: Playing Tetris”
- **Author credited on the answer:** Nas Banov
- **Source:** https://stackoverflow.com/questions/3858384/code-golf-playing-tetris
- **Original answer size:** 298 characters
- **License:** Creative Commons Attribution-ShareAlike 2.5

The Stack Overflow Help Center states that public contributions made before April 8, 2011 are distributed under CC BY-SA 2.5. The challenge and answer were posted in October 2010.

Modifications in this repository include a transposed tetromino lookup, version-specific syntax changes, compressed self-extracting wrappers, independent test vectors, and native-runtime proof infrastructure. The candidate files remain available under CC BY-SA 2.5 as derivative works.

The 316-character compressed Python 2 answer by P Daddy on the same page is prior art for the use of Python 2’s `zip` codec, although the compressed payload in this repository is based on the modified Nas Banov algorithm.

## Playable candidates

The playable-core candidates and proof infrastructure were created for this repository. They are not copied from the prior-art projects listed below and are MIT licensed.

Relevant independent prior art:

- `tiny-tetris`, Nick Paz: https://github.com/nickmpaz/tiny-tetris
- “Binary Tetris in Tweets,” Code Golf Stack Exchange: https://codegolf.stackexchange.com/questions/121281/binary-tetris-in-tweets
- “(Re)Implementing Tetris,” Code Golf Stack Exchange: https://codegolf.stackexchange.com/questions/11175/reimplementing-tetris

These works use different feature requirements, board sizes, or readability constraints.
