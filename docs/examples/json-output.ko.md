# JSON 출력 예시

[English](json-output.md) | [한국어](json-output.ko.md) | [日本語](json-output.ja.md) | [中文](json-output.zh.md)

AIGate 결과를 스크립트, CI, dashboard에서 사용해야 할 때 JSON 출력을 사용합니다.

```sh
aigate check --format json
aigate pr-check --format json
aigate evaluate-project --format json
aigate branch-strategy --compare --format json
aigate notify send --channel linear --dry-run --format json
```

간단한 스크립트 예시:

```sh
score="$(aigate evaluate-project --format json | node -e 'let d=\"\";process.stdin.on(\"data\",c=>d+=c);process.stdin.on(\"end\",()=>console.log(JSON.parse(d).score))')"
test "$score" -ge 80
```
