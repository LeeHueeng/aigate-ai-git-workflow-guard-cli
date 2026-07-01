# 通知

[English](notifications.md) | [한국어](notifications.ko.md) | [日本語](notifications.ja.md) | [中文](notifications.zh.md)

AIGate は `BLOCK`、`WARN`、`SECRET_DETECTED` などの workflow event を
ローカル端末や webhook channel に送信できます。

## チャンネル

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

## チャンネルをテスト

```sh
aigate notify test --event WARN --channel terminal
AIGATE_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  aigate notify test --event BLOCK --channel slack
```

送信せずに route をプレビュー:

```sh
aigate notify send --event BLOCK --channel slack --dry-run
aigate notify send --event BLOCK --channel linear --dry-run --format json
```

## Issue tracker チャンネル

Linear は Linear GraphQL API で issue を作成します。

```sh
AIGATE_LINEAR_API_KEY="lin_api_..." \
AIGATE_LINEAR_TEAM_ID="team-id" \
  aigate notify send --event BLOCK --channel linear
```

Jira は Jira Cloud REST API v3 で issue を作成します。

```sh
AIGATE_JIRA_BASE_URL="https://example.atlassian.net" \
AIGATE_JIRA_EMAIL="you@example.com" \
AIGATE_JIRA_API_TOKEN="..." \
AIGATE_JIRA_PROJECT_KEY="ENG" \
  aigate notify send --event BLOCK --channel jira
```

## BLOCK 時の通知

readiness gate が block したときに Slack 通知を送ります。

```sh
AIGATE_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  aigate git-ready --notify-channel slack
```

同じ通知は guarded push と PR 作成フローでも動作します。

```sh
aigate push --notify-channel slack -u origin feature/my-work
aigate pr --notify-channel slack --title "feat: my work"
```

## Payload

- Slack は `text`、`blocks`、`aigate` metadata object を受け取ります。
- Discord は `content`、`embeds`、`aigate` metadata object を受け取ります。
- Teams は MessageCard payload と `aigate` metadata object を受け取ります。
- Email webhook は `to`、`subject`、`text`、`aigate` metadata を受け取ります。
- Linear は `IssueCreate` GraphQL mutation を受け取ります。
- Jira は Atlassian document format の issue 作成 payload を受け取ります。
- Custom webhook は `text` と raw AIGate event metadata を受け取ります。

metadata には event、branch、gate status、changed file count、project score、
secret finding count、blockers、warnings、recommendation、generation time が
含まれます。
