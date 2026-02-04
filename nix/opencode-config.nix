{
  pkgs,
  config,
}: let
  jsonFormat = pkgs.formats.json {};

  githubToolsets = "context,actions,code_security,dependabot,discussions,gists,git,issues,labels,notifications,orgs,projects,pull_requests,repos,secret_protection,security_advisories,stargazers,users";

  opencodeConfigAttrs = {
    "$schema" = "https://opencode.ai/config.json";
    default_agent = "codex";
    model = "opencode/gpt-5.1-codex-max";
    provider = {
      opencode = {
        models = {
          "gpt-5.1-codex-max" = {
            options = {
              reasoningEffort = "xhigh";
              reasoningSummary = "auto";
            };
          };
        };
      };
    };
    permission = "allow";
    agent = {
      codex = {
        description = "Codex-style primary agent";
        mode = "primary";
      };
    };
    mcp = {
      github = {
        type = "local";
        command = ["github-mcp-server" "stdio"];
        enabled = true;
        environment = {
          GITHUB_TOOLSETS = githubToolsets;
          GITHUB_PERSONAL_ACCESS_TOKEN = "{env:GITHUB_PERSONAL_ACCESS_TOKEN}";
        };
      };
      zoo = {
        type = "local";
        command = ["uvx" "zoo-mcp"];
        enabled = false;
        environment = {
          ZOO_API_TOKEN = "{env:ZOO_API_TOKEN}";
        };
        timeout = 60000;
      };
    };
  };
in {
  file = jsonFormat.generate "opencode.json" opencodeConfigAttrs;
  attrs = opencodeConfigAttrs;
}
