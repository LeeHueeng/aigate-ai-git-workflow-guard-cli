# Windows 스모크 테스트 메모

[English](windows-smoke-test.md) | [한국어](windows-smoke-test.ko.md) | [日本語](windows-smoke-test.ja.md) | [中文](windows-smoke-test.zh.md)

Node.js 20 이상 설치 후 PowerShell에서 실행합니다.

```powershell
npx -y aigate-cli --version
npx -y aigate-cli doctor --language ko
npx -y aigate-cli check --format json
```

로컬 checkout에서는 다음을 실행합니다.

```powershell
npm ci
npm run ci
node .\src\cli.mjs demo --language ko
```

기대 결과: 명령이 성공하고, `doctor`가 저장소 상태를 보고하며, JSON 출력에서
shell quoting 오류가 없어야 합니다.
