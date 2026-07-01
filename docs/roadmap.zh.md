# 路线图

[English](roadmap.md) | [한국어](roadmap.ko.md) | [日本語](roadmap.ja.md) | [中文](roadmap.zh.md)

## V1: CLI distribution and local reports

- [x] 将 `aigate-cli` publish 到 npm
- [x] 支持 npm、npx、yarn、pnpm、bun install path
- [x] 通过 `aigate init` 创建 starter project configuration
- [x] 生成 Markdown、HTML、JSON、SARIF reports
- [x] 通过 `aigate pr-check` 生成 pull request readiness report
- [x] 通过 `aigate doctor` 诊断 first-run setup
- [x] 通过 `aigate demo` 显示 guided CLI demo
- [x] 通过 `aigate install-hook --pre-push` 安装 guarded pre-push hook
- [x] 为 blocking event 发送 Slack webhook notification
- [x] 支持 optional deep Git signals 的 weighted project evaluation
- [x] 基于 repository 和 team signal 推荐 branch strategy
- [x] 通过 `aigate release-check` 验证 first package release readiness
- [x] 通过 `aigate audit-report` 生成 governance snapshot

## V1.5: Workflow intelligence

- [ ] publish Homebrew formula
- [ ] local Docker usage 验证后 publish Docker image
- [ ] 将 bundled GitHub composite action 升级为 reusable public action
- [x] 添加 Discord 和 Teams webhook notification payload
- [ ] 将 generated branch strategy docs 扩展为 richer policy pack
- [x] 将 PR 模板和 CODEOWNERS 草案升级为引导式设置

## V2: Team reports and GitHub integration

- [x] 在 GitHub pull request 上 comment AIGate summary
- [x] 通过 `aigate github check` 准备 GitHub Checks 和 Actions summary
- [x] 生成 weekly team reports
- [x] 通过 `aigate trends` 跟踪项目状态趋势
- [ ] 集成 Linear 和 Jira
- [ ] publish standalone binaries
- [ ] 比较多个 AI-generated branch strategy proposals

## V3: Enterprise governance

- [ ] organization dashboards
- [x] 生成 policy violation audit reports
- [ ] 生成 compliance reports
- [ ] 管理 central notification policies
- [ ] 支持 self-hosted reporting
- [ ] 支持 enterprise offline installers
- [ ] 应用 organization-standard branch strategies
