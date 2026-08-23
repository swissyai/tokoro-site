# Tokoro site

The one-screen site for [Tokoro](https://github.com/swissyai/tokoro), with the headline **A place for local models.**

Live at [tokoro.sh](https://tokoro.sh).

## Design

The page combines Tokoro's Cursor Home and Threshold identity:

- a static ASCII field on the base canvas
- one slow, deterministic local-model phrase decoding on a transparent text canvas above it
- a fixed white cursor loading bottom-to-top
- an unlabeled causal mask and paired cache pages during the one-shot launch
- a cyan afterglow only after impact
- a centered Threshold mark, wordmark, headline, Japanese line, and GitHub action

The page is dependency-free, responsive, one viewport, no scroll, and black/white/cyan. Background layers never track pointer movement. Reduced-motion preferences resolve to a static authored phrase.

## Local verification

Requires Node.js 20 or later and no package installation:

```sh
npm run check
```

The check validates JavaScript, runs the design-contract tests, and creates `dist/` from an explicit production allowlist.

## Production build

```sh
npm run build
```

Only these production files enter `dist/`:

- `index.html`
- `404.html`
- `styles.css`
- `script.js`
- `_headers`
- `assets/favicon.svg`

Local design studios, experiments, tests, and source documentation are not deployed.

## Cloudflare deployment

Cloudflare serves `dist/` through an assets-only Worker bound to `tokoro.sh`. There is no application backend. The deploy command uses the caller's existing Wrangler authorization and does not store account credentials in this repository.

```sh
export CLOUDFLARE_ACCOUNT_ID="..."
npm run deploy
```

`_headers` enforces a same-origin content security policy, disables unnecessary browser capabilities, and blocks analytics connections. Cloudflare edge request counts may exist at the infrastructure layer, but the page sends no analytics beacon and retains no browser identity.

## Files

- `index.html`: structure, metadata, identity, and sole GitHub action
- `styles.css`: fixed-viewport layout, threshold, layering, and motion contracts
- `script.js`: static field, deterministic text scramble, and launch cue
- `build.mjs`: dependency-free production allowlist builder
- `_headers`: security and cache policy
- `wrangler.jsonc`: assets-only Worker and custom-domain binding
- `tests/`: deterministic identity, layering, motion, privacy, and pointer-regression checks
- `assets/favicon.svg`: compact Threshold mark

## License

Code and project-authored assets are available under `MIT OR Apache-2.0`. The Tokoro name and visual identity follow the trademark policy in the main Tokoro repository.
