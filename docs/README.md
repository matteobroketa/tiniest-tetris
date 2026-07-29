# GitHub Pages site

This folder is a dependency-free static site for the `tiniest-tetris` repository.

## Publish

In GitHub, open **Settings → Pages** and select:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/docs**

The site will be published at:

`https://matteobroketa.github.io/tiniest-tetris/`

## Local preview

From the repository root:

```sh
python3 -m http.server 8000 --directory docs
```

Open `http://localhost:8000/`.

The optional exact-Python browser run downloads the pinned Pyodide runtime only after the visitor presses **Run exact Python**. The JavaScript demonstrations and source browser work without Pyodide.

## Candidate assets

Files under `docs/assets/candidates/` are byte-for-byte copies of the record artifacts. Run:

```sh
python3 tools/verify_pages.py
```

before committing changes. The verification workflow also runs this check in GitHub Actions.
