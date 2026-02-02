{
  pkgs,
  config,
}: let
  tomlFormat = pkgs.formats.toml {};
  homeDir = config.home.homeDirectory;
  isDarwin = pkgs.stdenv.isDarwin;

  writableRoots = [
    "${homeDir}/.cache"
    "${homeDir}/.cache/pip"
    "${homeDir}/.cache/uv"
    "${homeDir}/.cargo"
    "${homeDir}/.rustup"
    "${homeDir}/.yarn"
    "${homeDir}/.npm"
    "${homeDir}/.local/share/pnpm"
  ];

  codexConfigAttrs =
    (pkgs.lib.optionalAttrs isDarwin {
      notify = ["python3" "${homeDir}/.codex/notify.py"];
    })
    // {
      model_reasoning_effort = "xhigh";
      model_reasoning_summary = "auto";
      file_opener = "none";
      show_raw_agent_reasoning = true;
      web_search = "live";
      mcp_servers = {
        github = {
          command = "github-mcp-server";
          args = ["stdio"];
          env = {
            GITHUB_TOOLSETS = "context,actions,code_security,dependabot,discussions,gists,git,issues,labels,notifications,orgs,projects,pull_requests,repos,secret_protection,security_advisories,stargazers,users";
          };
          env_vars = ["GITHUB_PERSONAL_ACCESS_TOKEN"];
        };
        zoo = {
          command = "uvx";
          args = ["zoo-mcp"];
          enabled = false;
          env_vars = ["ZOO_API_TOKEN"];
          startup_timeout_sec = 60;
        };
      };
      sandbox_mode = "workspace-write";
      approval_policy = "on-request";
      sandbox_workspace_write = {
        network_access = true;
        writable_roots = writableRoots;
      };
      shell_environment_policy = {
        "inherit" = "all";
        ignore_default_excludes = true;
      };
    };
in {
  file = tomlFormat.generate "codex-config.toml" codexConfigAttrs;
  attrs = codexConfigAttrs;
}
