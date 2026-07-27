# Contributing

Byte reductions are welcome when they preserve a documented ruleset.

A submission should:

1. identify the target runtime and ruleset;
2. preserve the candidate as exact bytes with no trailing newline unless counted;
3. update `proofs/manifest.json` with the exact byte count and SHA-256;
4. provide or update a readable payload for compressed entries;
5. pass the complete GitHub Actions matrix;
6. disclose any new input bound, terminal assumption, implementation restriction, or feature removal;
7. include prior-art attribution when the technique or source is derived from another entry.

Do not auto-format candidate files. `.gitattributes` marks the entire candidate tree as binary to prevent newline conversion.

A smaller file that changes the specification belongs in a separately named ruleset rather than silently replacing the principal record candidate.
