# 로드맵

[English](roadmap.md) | [한국어](roadmap.ko.md) | [日本語](roadmap.ja.md) | [中文](roadmap.zh.md)

## V1: CLI 배포와 로컬 리포트

- [x] `aigate-cli`를 npm에 publish
- [x] npm, npx, yarn, pnpm, bun install path 지원
- [x] `aigate init`으로 starter project configuration 생성
- [x] Markdown, HTML, JSON, SARIF report 생성
- [x] `aigate pr-check`로 pull request readiness report 생성
- [x] `aigate doctor`로 첫 실행 설정 진단
- [x] `aigate demo`로 안내형 CLI 데모 제공
- [x] `aigate install-hook --pre-push`로 guarded pre-push hook 설치
- [x] blocking event에 Slack webhook notification 전송
- [x] optional deep Git signal을 포함한 weighted project evaluation
- [x] repository와 team signal 기반 branch strategy 추천
- [x] `aigate release-check`로 첫 package release readiness 검증
- [x] `aigate audit-report`로 governance snapshot 생성

## V1.5: Workflow intelligence

- [ ] Homebrew formula publish
- [ ] local Docker usage 검증 후 Docker image publish
- [x] bundled GitHub composite action을 reusable public action으로 승격
- [x] Discord와 Teams webhook notification payload 추가
- [ ] generated branch strategy docs를 richer policy pack으로 확장
- [x] PR 템플릿과 CODEOWNERS 초안을 안내형 설정으로 승격

## V2: Team reports와 GitHub integration

- [x] GitHub pull request에 AIGate summary comment 작성
- [x] `aigate github check`로 GitHub Checks와 Actions 요약 준비
- [x] weekly team report 생성
- [x] `aigate trends`로 프로젝트 상태 추세 추적
- [ ] Linear와 Jira 연동
- [ ] standalone binary publish
- [ ] 여러 AI-generated branch strategy proposal 비교

## V3: Enterprise governance

- [ ] organization dashboard
- [x] policy violation audit report 생성
- [ ] compliance report 생성
- [ ] central notification policy 관리
- [ ] self-hosted reporting 지원
- [ ] enterprise offline installer 지원
- [ ] organization-standard branch strategy 적용
