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
      model = "gpt-5.4";
      model_reasoning_effort = "xhigh";
      model_reasoning_summary = "auto";
      personality = "none";
      file_opener = "none";
      show_raw_agent_reasoning = true;
      web_search = "live";
      features = {
        multi_agent = true;
      };
      mcp_servers = {
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
