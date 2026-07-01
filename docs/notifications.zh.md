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
- Custom webhook 接收 `text` 和原始 AIGate event metadata。

metadata 包含 event、branch、gate status、changed file count、project score、
secret finding count、blockers、warnings、recommendation 和 generation time。
