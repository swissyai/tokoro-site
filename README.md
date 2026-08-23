# Tokoro site

The dependency-free site for [Tokoro](https://github.com/swissyai/tokoro): **A place for local models.**

Live at [tokoro.sh](https://tokoro.sh).

`OPEN-SOURCE ALPHA · NO USAGE TELEMETRY`

## Local verification

Requires Node.js 20 or later and no package installation:

```sh
npm run check
```

The production build is generated from an explicit file allowlist:

```sh
npm run build
```

## Deployment

The site is deployed as static assets through Cloudflare. Wrangler uses the caller's existing authorization; this repository contains no account credentials.

```sh
npm run deploy
```

## Privacy

The page has no analytics beacon, cookies, forms, account flow, or application backend. Its content security policy blocks third-party scripts and analytics connections.

## License

Code is available under `MIT OR Apache-2.0`. The Tokoro name and official visual identity are reserved.
