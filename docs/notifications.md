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
- Custom webhooks receive `text` plus the raw AIGate event metadata.

The metadata includes the event, branch, gate status, changed file count,
project score, secret finding count, blockers, warnings, recommendation, and
generation time.
