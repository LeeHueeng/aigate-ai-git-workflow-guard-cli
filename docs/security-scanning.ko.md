# 보안 스캔

[English](security-scanning.md) | [한국어](security-scanning.ko.md) | [日本語](security-scanning.ja.md) | [中文](security-scanning.zh.md)

AIGate에는 변경 파일을 대상으로 하는 가벼운 로컬 scanner가 포함되어 있습니다.

## 확인하는 항목

scanner는 Git에서 변경된 파일을 대상으로 다음 패턴을 찾습니다.

- AWS access key ID
- GitHub token
- Slack token
- private key block
- `api_key = "..."` 같은 일반 secret assignment

대용량 파일과 일반적인 binary format은 건너뜁니다.

## 명령어

```sh
aigate check
aigate git-ready
aigate report --format sarif
```

`aigate git-ready`는 가능한 secret이 감지되면 차단합니다.

## 현재 한계

이 scanner는 의도적으로 local, dependency-free로 설계되었습니다. GitHub secret
scanning, GitGuardian, 전용 enterprise secret detection service를 완전히
대체하는 목적은 아닙니다.
