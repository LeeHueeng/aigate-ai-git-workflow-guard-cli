class AigateCli < Formula
  desc "Pre-push Git safety CLI for AI-assisted coding"
  homepage "https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli"
  url "https://registry.npmjs.org/aigate-cli/-/aigate-cli-0.1.6.tgz"
  sha256 "bb2d73875923d7ba20640036fc87e7357ad92c4d94e2c5876692854df15f93f1"
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
