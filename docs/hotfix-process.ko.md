# 핫픽스 프로세스

[English](hotfix-process.md) | [한국어](hotfix-process.ko.md) | [日本語](hotfix-process.ja.md) | [中文](hotfix-process.zh.md)

핫픽스는 긴급한 프로덕션 문제 또는 이미 공개된 패키지 결함에만 사용합니다.

## 흐름

1. `main` 또는 최신 안정 태그에서 `hotfix/<short-description>`을 만듭니다.
2. 패치는 최소화하고 관련 없는 정리는 피합니다.
3. `npm run ci`와 `aigate git-ready`를 실행합니다.
4. `main` 대상 pull request를 엽니다.
5. 사용자 영향, 검증, 패치 릴리스 필요 여부를 적습니다.
6. 병합 후 patch version을 올리고 릴리스 프로세스를 따릅니다.

## 커뮤니케이션

- 사용자가 영향을 받으면 GitHub issue 또는 release note 항목을 남깁니다.
- 운영 신호가 필요하면 `aigate notify send --channel slack` 또는
  `--channel linear`를 사용합니다.
- 활성 release branch에 같은 수정이 필요할 때만 backport합니다.
