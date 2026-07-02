# 오픈소스 준비 상태

[English](open-source-readiness.md) | [한국어](open-source-readiness.ko.md) | [日本語](open-source-readiness.ja.md) | [中文](open-source-readiness.zh.md)

이 checklist는 AIGate가 공개 contributor에게도 유용하고 신뢰할 수 있게 유지되도록 돕습니다.

## 커뮤니티 기반

- [x] README
- [x] LICENSE
- [x] CONTRIBUTING
- [x] SECURITY
- [x] SUPPORT
- [x] CODE_OF_CONDUCT
- [x] CHANGELOG
- [x] issue templates
- [x] pull request template
- [x] CODEOWNERS
- [x] funding metadata
- [x] social preview asset: `assets/social-preview.png`
- [x] 실제 사용 사례 issue template

## 보안과 공급망

- [x] GitHub branch protection
- [x] required CI checks
- [x] Dependabot
- [x] local secret scanning
- [x] SARIF report output
- [x] OpenSSF Scorecard workflow
- [x] npm Trusted Publishing workflow scaffold
- [x] release readiness check
- [x] audit report command
- [x] local Dockerfile
- [x] 재사용 가능한 공개 GitHub Action

## Maintainer workflow

- commit 전 `aigate git-ready` 사용
- raw `git push` 대신 `aigate push` 사용
- pull request 생성에 `aigate pr` 사용
- `main`을 항상 releasable 상태로 유지
- roadmap item을 issue 또는 discussion과 연결
- GitHub repository settings에서 `assets/social-preview.png` 업로드
- 유용한 support question을 문서나 good first issue로 전환

## npm release

- [x] `aigate-cli` npm 접근 권한 확보
- [x] 이 GitHub repository용 npm Trusted Publisher 설정
- [x] `aigate release-check` 실행
- [x] npm package publish, 현재 공개 버전은 `0.1.2`
- [x] GitHub release tag를 `v0.1.2`까지 생성
- [x] publish 후 `npm view aigate-cli` 확인
- [x] future release를 changelog entry와 tagged GitHub Release에 연결
