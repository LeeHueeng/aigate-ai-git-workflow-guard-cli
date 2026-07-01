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
- Custom webhook は `text` と raw AIGate event metadata を受け取ります。

metadata には event、branch、gate status、changed file count、project score、
secret finding count、blockers、warnings、recommendation、generation time が
含まれます。
