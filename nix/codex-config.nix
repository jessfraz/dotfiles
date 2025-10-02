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
      model_reasoning_effort = "high";
      model_reasoning_summary = "auto";
      file_opener = "none";
      show_raw_agent_reasoning = true;
      tools = {
        web_search = true;
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
      # ─── Zoo-MCP spawns via stdio ──────────────────────────────────────────────
      mcp_servers = {
        zoo = {
          command = "uvx";
          args = ["zoo-mcp"];
        };
      };
    };
in {
  file = tomlFormat.generate "codex-config.toml" codexConfigAttrs;
  attrs = codexConfigAttrs;
}
