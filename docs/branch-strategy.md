# Branch Strategy

AIGate uses GitHub Flow as the default development model, extended with
release branches and npm dist-tags for package publication.

## Goals

- Keep `main` stable and releasable.
- Make every meaningful change reviewable through a pull request.
- Preserve a clear history with Conventional Commits.
- Support fast AI-assisted work without mixing unrelated changes.
- Support public package channels: `latest`, `next`, `beta`, and `canary`.

## Permanent Branches

| Branch | Purpose | Rules |
| --- | --- | --- |
| `main` | Stable source of truth. | Protected, no direct pushes after bootstrap, all changes through PR. |
| `release/*` | Release stabilization. | Created only when preparing a versioned release. |
| `hotfix/*` | Urgent production fix. | Branch from the latest stable tag or `main`, merge back through PR. |

## Work Branch Prefixes

| Prefix | Use |
| --- | --- |
| `codex/*` | AI-assisted implementation or repository maintenance. |
| `feature/*` | User-facing feature work. |
| `fix/*` | Bug fixes. |
| `docs/*` | Documentation-only changes. |
| `chore/*` | Tooling, metadata, release, or maintenance changes. |
| `test/*` | Test-only improvements. |
| `experiment/*` | Short-lived spikes that may be closed without merge. |

## Initial Bootstrap Strategy

This repository started empty, so the first commit on `main` establishes only
public repository metadata. Product docs, GitHub templates, and CLI scaffolding
belong on `codex/bootstrap-aigate-repo` and should be merged through a pull
request when the GitHub remote is ready.

## Pull Request Rules

- One concern per pull request.
- Use a branch name that communicates intent, for example
  `feature/report-generator` or `codex/bootstrap-aigate-repo`.
- Include a summary, validation steps, and release or documentation impact.
- Resolve all review conversations before merge.
- Run `npm run git:ready` locally before requesting review.
- Require CODEOWNERS review once maintainers are finalized.

## Commit Strategy

Use Conventional Commits:

```text
feat: add branch strategy recommendation command
fix: handle repositories without commits
docs: explain public release channels
test: cover report output formats
chore: initialize public repository metadata
```

Recommended commit boundaries:

- `chore`: repository metadata, dependency setup, release config.
- `docs`: product plan, branch strategy, public contribution guidance.
- `feat`: user-visible CLI commands and behavior.
- `test`: test coverage and fixtures.
- `fix`: defects in existing behavior.

## Protection Rules For GitHub

When the public repository is created, enable these branch protection rules on
`main`:

- Require pull request before merging.
- Do not require mandatory approval by default.
- Enable maintainer or CODEOWNER review when the repository policy needs it.
- Require status checks to pass.
- Require conversation resolution.
- Block force pushes.
- Block deletions.
- Require linear history if release automation works with it.

Initial required status checks:

- `test (20)`
- `test (22)`
- local: `npm run lint`
- local: `npm run typecheck`

## Proposal Comparison

`aigate branch-strategy --compare` compares GitHub Flow with release channels,
Trunk-Based Development, Hybrid Flow, and Git Flow. Each proposal includes a
fit score, branch rules, best-fit situation, strengths, risks, migration steps,
and policy fit.

Use it when a repository has enough signal to debate more than one branch model:

```sh
aigate branch-strategy --compare --team-size 8 --release weekly
aigate branch-strategy --compare --team-size 14 --release monthly --language ko
```

## Generated Policy Packs

`aigate branch-strategy --apply` creates reusable policy packs under
`.aigate/policy-packs/`:

- `branch-protection.json`: protected branch, review, status check, and force
  push rules.
- `pr-quality.json`: pull request sections, validation commands, risk labels,
  and quality gates.
- `release-channels.json`: npm dist-tag, release tag, and pre-tag validation
  rules.
- `ai-collaboration.json`: AI-assisted branch prefixes, required repository
  context, and guard commands.

## Release Branch Flow

1. Merge completed work into `main`.
2. Create `release/vX.Y.Z` for stabilization only when needed.
3. Publish release candidates with `next`, `beta`, or `canary` dist-tags.
4. Tag stable releases as `vX.Y.Z`.
5. Publish stable packages with the `latest` dist-tag.
6. Merge release fixes back into `main`.

## Hotfix Flow

1. Create `hotfix/<short-description>` from `main` or the latest stable tag.
2. Commit the minimal fix.
3. Open a pull request into `main`.
4. Publish a patch release after checks pass.
5. Backport if any active release branch needs the same fix.

## AI-Assisted Work Rules

- Use `codex/*` branches for assistant-generated implementation work.
- Keep generated artifacts out of source unless they are intentional docs,
  templates, or reproducible fixtures.
- Stage files explicitly when unrelated work exists.
- Prefer multiple small commits over one mixed commit.
- Include the validation command in the pull request body.
- Run `npm run git:ready` before pushing AI-assisted work.
