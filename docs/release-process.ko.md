# 릴리스 프로세스

[English](release-process.md) | [한국어](release-process.ko.md) | [日本語](release-process.ja.md) | [中文](release-process.zh.md)

AIGate 릴리스는 태그 기반으로 동작합니다. 버전 태그를 만들기 전에 `main`은
배포 가능한 상태여야 합니다.

## 체크리스트

1. 변경이 `main`에 병합됐는지 확인합니다.
2. `package.json`, `package-lock.json`, `CHANGELOG.md`를 갱신합니다.
3. `npm run ci`를 실행합니다.
4. `aigate release-check --npm`을 실행합니다.
5. Release workflow를 `dry_run=true`로 실행합니다.
6. `v0.1.3`처럼 일치하는 태그를 만들고 푸시합니다.
7. `npm view aigate-cli version`으로 npm 배포를 확인합니다.
8. GitHub Release note를 생성하거나 갱신합니다.
9. Action을 공개한다면 릴리스 화면에서 GitHub Marketplace 게시 옵션을 켭니다.

## 채널

- `latest`: 안정 공개 릴리스
- `next`: 릴리스 후보
- `beta`: 베타 검증
- `canary`: 실험 빌드

## 롤백

잘못된 릴리스가 배포되면 패치 릴리스로 수정합니다. 민감 정보가 노출된 경우가
아니라면 npm 버전이나 Git 태그를 삭제하지 않습니다.
