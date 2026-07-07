class AigateCli < Formula
  desc "Pre-push Git safety CLI for AI-assisted coding"
  homepage "https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli"
  url "https://registry.npmjs.org/aigate-cli/-/aigate-cli-0.1.7.tgz"
  sha256 "fb30aafb89fd55f0df4e9dc8e1cc29f018ba70a2cd7c456e4dcb2616d004d341"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args(prefix: libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/aigate --version")
  end
end
