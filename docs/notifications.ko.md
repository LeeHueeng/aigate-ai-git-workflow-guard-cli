# 알림

[English](notifications.md) | [한국어](notifications.ko.md) | [日本語](notifications.ja.md) | [中文](notifications.zh.md)

AIGate는 `BLOCK`, `WARN`, `SECRET_DETECTED` 같은 workflow event를 로컬
터미널이나 webhook 채널로 보낼 수 있습니다.

## 채널

| 채널 | 환경 변수 | 상태 |
| --- | --- | --- |
| `terminal` | 없음 | 구현됨 |
| `slack` | `AIGATE_SLACK_WEBHOOK_URL` | 구현됨 |
| `discord` | `AIGATE_DISCORD_WEBHOOK_URL` | 구현됨 |
| `teams` | `AIGATE_TEAMS_WEBHOOK_URL` | 구현됨 |
| `email` | `AIGATE_EMAIL_WEBHOOK_URL` | 구현됨 |
| `linear` | `AIGATE_LINEAR_API_KEY`, `AIGATE_LINEAR_TEAM_ID` | 구현됨 |
| `jira` | `AIGATE_JIRA_BASE_URL`, `AIGATE_JIRA_EMAIL`, `AIGATE_JIRA_API_TOKEN`, `AIGATE_JIRA_PROJECT_KEY` | 구현됨 |
| custom webhook | `AIGATE_WEBHOOK_URL` | 구현됨 |

## 채널 테스트

```sh
aigate notify test --event WARN --channel terminal
AIGATE_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  aigate notify test --event BLOCK --channel slack
```

전송 없이 route만 미리보기:

```sh
aigate notify send --event BLOCK --channel slack --dry-run
aigate notify send --event BLOCK --channel linear --dry-run --format json
```

## 이슈 트래커 채널

Linear는 Linear GraphQL API로 이슈를 생성합니다.

```sh
AIGATE_LINEAR_API_KEY="lin_api_..." \
AIGATE_LINEAR_TEAM_ID="team-id" \
  aigate notify send --event BLOCK --channel linear
```

Jira는 Jira Cloud REST API v3로 이슈를 생성합니다.

```sh
AIGATE_JIRA_BASE_URL="https://example.atlassian.net" \
AIGATE_JIRA_EMAIL="you@example.com" \
AIGATE_JIRA_API_TOKEN="..." \
AIGATE_JIRA_PROJECT_KEY="ENG" \
  aigate notify send --event BLOCK --channel jira
```

## BLOCK 알림

readiness gate가 차단될 때 Slack 알림을 보냅니다.

```sh
AIGATE_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  aigate git-ready --notify-channel slack
```

같은 알림은 guarded push와 PR 생성 흐름에서도 동작합니다.

```sh
aigate push --notify-channel slack -u origin feature/my-work
aigate pr --notify-channel slack --title "feat: my work"
```

## Payload

- Slack은 `text`, `blocks`, `aigate` metadata object를 받습니다.
- Discord는 `content`, `embeds`, `aigate` metadata object를 받습니다.
- Teams는 MessageCard payload와 `aigate` metadata object를 받습니다.
- Email webhook은 `to`, `subject`, `text`, `aigate` metadata를 받습니다.
- Linear는 `IssueCreate` GraphQL mutation을 받습니다.
- Jira는 Atlassian document format 기반 issue 생성 payload를 받습니다.
- Custom webhook은 `text`와 원본 AIGate event metadata를 받습니다.

metadata에는 event, branch, gate status, changed file count, project score,
secret finding count, blockers, warnings, recommendation, generation time이
포함됩니다.
