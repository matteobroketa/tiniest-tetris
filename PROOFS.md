# Proof design

## Byte and payload proofs

`proofs/verify_manifest.py` checks the repository bytes directly. It does not import the candidates, so source encoding and interpreter behavior cannot alter the count.

`proofs/verify_payloads.py` independently parses the compressed literal, uses Python 3’s `zlib`, and compares the result with the committed readable source. This prevents a compressed wrapper from being counted without proving what it executes.

## Scripted oracle proof

`proofs/scripted_oracle.py` is an independent, readable implementation of specification S1. `proofs/generate_scripted_vectors.py` commits the historical sample plus 32 deterministic generated cases. Native candidate output is parsed into seven board rows and a numeric score before comparison.

This is a finite regression corpus, not an exhaustive proof over every legal board and command sequence.

## Playable trace proof

The proof stubs replace only the terminal boundary. Candidate game logic remains unmodified and runs under its target interpreter.

For each frame, the stub checks:

- exactly 20 rows;
- exactly 10 cells per row;
- only space and `#` cell values;
- no more than 10,000 rendered frames.

The deterministic key corpus must produce exactly:

```text
frames=477 clears=6 checksum=4287608623 keys=400
```

The checksum covers every character in every rendered frame, in order. A one-cell or one-frame behavioral change therefore changes the trace proof.

The seeded mode runs 32 further games per target runtime and requires the aggregate result `frames=5298 clears=1 checksum=2583409795`. It is intended to expose crashes, invalid frames, nontermination, and version-dependent behavior; it is not exhaustive state-space verification.

## Historical runtime proof

Python 1.6 and 2.7.18 are built from source because current GitHub-hosted runners do not provide them through normal tool caches. `tools/fetch_cpython.sh` verifies the downloaded archive before Docker builds it. The resulting image must import `zlib`, which is required by the compressed candidates.

The workflow records the interpreter version and Docker image ID in its logs.
