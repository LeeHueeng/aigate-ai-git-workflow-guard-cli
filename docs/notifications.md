# Notifications

AIGate can send local and webhook notifications for workflow events such as
`BLOCK`, `WARN`, and `SECRET_DETECTED`.

## Channels

| Channel | Environment variable | Status |
| --- | --- | --- |
| `terminal` | none | implemented |
| `slack` | `AIGATE_SLACK_WEBHOOK_URL` | implemented |
| `discord` | `AIGATE_DISCORD_WEBHOOK_URL` | implemented |
| `teams` | `AIGATE_TEAMS_WEBHOOK_URL` | implemented |
| `email` | `AIGATE_EMAIL_WEBHOOK_URL` | implemented |
| `linear` | `AIGATE_LINEAR_API_KEY`, `AIGATE_LINEAR_TEAM_ID` | implemented |
| `jira` | `AIGATE_JIRA_BASE_URL`, `AIGATE_JIRA_EMAIL`, `AIGATE_JIRA_API_TOKEN`, `AIGATE_JIRA_PROJECT_KEY` | implemented |
| custom webhook | `AIGATE_WEBHOOK_URL` | implemented |

## Test A Channel

```sh
aigate notify test --event WARN --channel terminal
AIGATE_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  aigate notify test --event BLOCK --channel slack
```

Preview a webhook route without sending:

```sh
aigate notify send --event BLOCK --channel slack --dry-run
aigate notify send --event BLOCK --channel linear --dry-run --format json
```

## Issue Tracker Channels

Linear creates an issue through the Linear GraphQL API:

```sh
AIGATE_LINEAR_API_KEY="lin_api_..." \
AIGATE_LINEAR_TEAM_ID="team-id" \
  aigate notify send --event BLOCK --channel linear
```

Jira creates an issue through Jira Cloud REST API v3:

```sh
AIGATE_JIRA_BASE_URL="https://example.atlassian.net" \
AIGATE_JIRA_EMAIL="you@example.com" \
AIGATE_JIRA_API_TOKEN="..." \
AIGATE_JIRA_PROJECT_KEY="ENG" \
  aigate notify send --event BLOCK --channel jira
```

## Notify On BLOCK

Send a Slack notification when the readiness gate blocks:

```sh
AIGATE_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  aigate git-ready --notify-channel slack
```

The same gate notification works through guarded push and pull request flows:

```sh
aigate push --notify-channel slack -u origin feature/my-work
aigate pr --notify-channel slack --title "feat: my work"
```

## Payloads

- Slack receives `text`, `blocks`, and an `aigate` metadata object.
- Discord receives `content`, `embeds`, and an `aigate` metadata object.
- Teams receives a MessageCard payload plus an `aigate` metadata object.
- Email webhooks receive `to`, `subject`, `text`, and `aigate` metadata.
- Linear receives an `IssueCreate` GraphQL mutation.
- Jira receives an issue create payload using Atlassian document format.
- Custom webhooks receive `text` plus the raw AIGate event metadata.

The metadata includes the event, branch, gate status, changed file count,
project score, secret finding count, blockers, warnings, recommendation, and
generation time.
