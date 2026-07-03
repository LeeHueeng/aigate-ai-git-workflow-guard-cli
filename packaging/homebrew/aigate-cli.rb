class AigateCli < Formula
  desc "Pre-push Git safety CLI for AI-assisted coding"
  homepage "https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli"
  url "https://registry.npmjs.org/aigate-cli/-/aigate-cli-0.1.6.tgz"
  sha256 "7f86e496a113bdf40b9117696908029b751c97f264d9a69c3f508607cfa906bf"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/aigate --version")
  end
end
