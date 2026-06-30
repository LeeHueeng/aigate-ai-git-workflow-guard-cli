# Security Policy

## Supported Versions

AIGate is in early public bootstrap. Security fixes currently target `main`
until the first tagged release exists.

## Reporting A Vulnerability

Please do not open a public issue for a suspected vulnerability. Contact the
maintainer privately and include:

- affected command or workflow
- reproduction steps
- expected impact
- relevant logs with secrets removed

## Secret Handling

Never commit tokens, private keys, webhook URLs, or production credentials.
Use `.env` files locally and keep them ignored. Example configuration should
use fake values only.
