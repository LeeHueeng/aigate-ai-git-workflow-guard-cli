# JSON 输出示例

[English](json-output.md) | [한국어](json-output.ko.md) | [日本語](json-output.ja.md) | [中文](json-output.zh.md)

当 AIGate 结果需要被脚本、CI 或 dashboard 消费时，使用 JSON 输出。

```sh
aigate check --format json
aigate pr-check --format json
aigate evaluate-project --format json
aigate branch-strategy --compare --format json
aigate notify send --channel linear --dry-run --format json
```

简单脚本示例:

```sh
score="$(aigate evaluate-project --format json | node -e 'let d=\"\";process.stdin.on(\"data\",c=>d+=c);process.stdin.on(\"end\",()=>console.log(JSON.parse(d).score))')"
test "$score" -ge 80
```
