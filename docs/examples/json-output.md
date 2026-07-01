# JSON Output Examples

[English](json-output.md) | [한국어](json-output.ko.md) | [日本語](json-output.ja.md) | [中文](json-output.zh.md)

Use JSON output when AIGate results need to be consumed by scripts, CI, or
dashboards.

```sh
aigate check --format json
aigate pr-check --format json
aigate evaluate-project --format json
aigate branch-strategy --compare --format json
aigate notify send --channel linear --dry-run --format json
```

Minimal script example:

```sh
score="$(aigate evaluate-project --format json | node -e 'let d=\"\";process.stdin.on(\"data\",c=>d+=c);process.stdin.on(\"end\",()=>console.log(JSON.parse(d).score))')"
test "$score" -ge 80
```
