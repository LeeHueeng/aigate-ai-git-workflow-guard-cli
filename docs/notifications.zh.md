# 通知

[English](notifications.md) | [한국어](notifications.ko.md) | [日本語](notifications.ja.md) | [中文](notifications.zh.md)

AIGate 可以把 `BLOCK`、`WARN`、`SECRET_DETECTED` 等 workflow event 发送到
本地终端或 webhook channel。

## 渠道

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

## 测试渠道

```sh
aigate notify test --event WARN --channel terminal
AIGATE_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  aigate notify test --event BLOCK --channel slack
```

不发送请求，只预览 route:

```sh
aigate notify send --event BLOCK --channel slack --dry-run
aigate notify send --event BLOCK --channel linear --dry-run --format json
```

## Issue tracker 渠道

Linear 通过 Linear GraphQL API 创建 issue。

```sh
AIGATE_LINEAR_API_KEY="lin_api_..." \
AIGATE_LINEAR_TEAM_ID="team-id" \
  aigate notify send --event BLOCK --channel linear
```

Jira 通过 Jira Cloud REST API v3 创建 issue。

```sh
AIGATE_JIRA_BASE_URL="https://example.atlassian.net" \
AIGATE_JIRA_EMAIL="you@example.com" \
AIGATE_JIRA_API_TOKEN="..." \
AIGATE_JIRA_PROJECT_KEY="ENG" \
  aigate notify send --event BLOCK --channel jira
```

## BLOCK 通知

当 readiness gate 阻止流程时发送 Slack 通知。

```sh
AIGATE_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  aigate git-ready --notify-channel slack
```

同样的通知也适用于 guarded push 和 PR 创建流程。

```sh
aigate push --notify-channel slack -u origin feature/my-work
aigate pr --notify-channel slack --title "feat: my work"
```

## Payload

- Slack 接收 `text`、`blocks` 和 `aigate` metadata object。
- Discord 接收 `content`、`embeds` 和 `aigate` metadata object。
- Teams 接收 MessageCard payload 和 `aigate` metadata object。
- Email webhook 接收 `to`、`subject`、`text` 和 `aigate` metadata。
- Linear 接收 `IssueCreate` GraphQL mutation。
- Jira 接收 Atlassian document format 的 issue 创建 payload。
- Custom webhook 接收 `text` 和原始 AIGate event metadata。

metadata 包含 event、branch、gate status、changed file count、project score、
secret finding count、blockers、warnings、recommendation 和 generation time。
