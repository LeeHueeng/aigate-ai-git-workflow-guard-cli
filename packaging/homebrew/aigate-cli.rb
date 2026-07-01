class AigateCli < Formula
  desc "Pre-push Git safety CLI for AI-assisted coding"
  homepage "https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli"
  url "https://registry.npmjs.org/aigate-cli/-/aigate-cli-0.1.2.tgz"
  sha256 "1a6c5f6f1f2ac26c0a174142722e629b5fb36d7a06fcaf7dbcf9b7f53f364b08"
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
