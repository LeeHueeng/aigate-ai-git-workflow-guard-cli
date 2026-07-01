# Security Scanning

AIGate includes a lightweight local scanner for changed files.

## What It Checks

The scanner runs against files changed in Git and looks for:

- AWS access key IDs
- GitHub tokens
- Slack tokens
- private key blocks
- generic secret assignments such as `api_key = "..."`

Large files and common binary formats are skipped.

## Commands

```sh
aigate check
aigate git-ready
aigate report --format sarif
```

`aigate git-ready` blocks when a possible secret is detected.

## Current Limits

This scanner is intentionally local and dependency-free. It is not a full
replacement for GitHub secret scanning, GitGuardian, or a dedicated enterprise
secret detection service.
