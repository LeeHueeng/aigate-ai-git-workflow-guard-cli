# Git Upload Workflow

Use this workflow for every AIGate change that will be pushed to GitHub.

## 1. Start From The Right Branch

```sh
git switch main
git pull --ff-only
git switch -c feature/<short-name>
```

Use one of these prefixes:

- `feature/*` for new user-facing behavior.
- `fix/*` for bug fixes.
- `docs/*` for documentation.
- `chore/*` for maintenance.
- `codex/*` for AI-assisted repository work.

## 2. Check The Work Before Commit

Choose your local CLI language once:

```sh
aigate setup --language ko
```

```sh
npm run git:ready
git status --short --branch
```

`npm run git:ready` runs syntax checks, the test suite, the AIGate before-push
gate, and package dry-run validation.

The gate blocks on:

- possible secret-bearing filenames
- missing repository foundations
- project foundation score below 80

## 3. Commit With A Clear Boundary

```sh
git add <files>
git commit -m "type: short summary"
```

Use Conventional Commits:

- `feat: add report command`
- `fix: handle empty repositories`
- `docs: document branch protection`
- `chore: update repository metadata`
- `test: cover git-ready output`

## 4. Push And Open A Pull Request

```sh
aigate push -u origin <branch>
```

`aigate push` runs the AIGate readiness gate first. If the gate passes, it
forwards the remaining arguments to `git push`. Use `aigate push --dry-run
origin <branch>` to preview the command without changing the remote.

Open a pull request into `main`. Include:

- what changed
- why it changed
- validation commands
- release or documentation impact

You can also let AIGate call GitHub CLI:

```sh
aigate pr --title "feat: short summary"
```

## 5. Merge Rules

Do not merge until:

- the `test (20)` and `test (22)` CI jobs pass
- at least one approval exists
- review conversations are resolved
- the branch has no unrelated changes
