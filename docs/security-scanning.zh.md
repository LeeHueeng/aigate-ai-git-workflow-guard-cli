# 安全扫描

[English](security-scanning.md) | [한국어](security-scanning.ko.md) | [日本語](security-scanning.ja.md) | [中文](security-scanning.zh.md)

AIGate 包含一个面向 changed files 的轻量本地 scanner。

## 检查内容

scanner 会在 Git 变更文件中查找:

- AWS access key ID
- GitHub token
- Slack token
- private key block
- `api_key = "..."` 这类 generic secret assignment

大型文件和常见 binary format 会被跳过。

## 命令

```sh
aigate check
aigate git-ready
aigate report --format sarif
```

当发现可能的 secret 时，`aigate git-ready` 会阻止流程。

## 当前限制

这个 scanner 有意保持 local 和 dependency-free。它不是 GitHub secret scanning、
GitGuardian 或专用 enterprise secret detection service 的完整替代品。
