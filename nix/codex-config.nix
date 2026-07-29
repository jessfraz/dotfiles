{
  pkgs,
  config,
}: let
  tomlFormat = pkgs.formats.toml {};
  homeDir = config.home.homeDirectory;
  isDarwin = pkgs.stdenv.isDarwin;
  unifiMcp = pkgs.writeShellApplication {
    name = "unifi-mcp";
    runtimeInputs = [pkgs.jq pkgs.uv];
    text = builtins.readFile ../bin/unifi-mcp;
  };

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
      model = "gpt-5.6-sol";
      model_reasoning_effort = "xhigh";
      model_reasoning_summary = "auto";
      personality = "none";
      file_opener = "none";
      show_raw_agent_reasoning = true;
      web_search = "live";
      features = {
        fast_mode = true;
        multi_agent = true;
        memories = true;
        chronicle = true;
        js_repl = false;
      };
      marketplaces = {
        "openai-bundled" = {
          last_updated = "2026-04-21T02:32:07Z";
          source_type = "local";
          source = "${homeDir}/.codex/.tmp/bundled-marketplaces/openai-bundled";
        };
        "openai-primary-runtime" = {
          last_updated = "2026-06-15T01:10:55Z";
          source_type = "local";
          source = "${homeDir}/.cache/codex-runtimes/codex-primary-runtime/plugins/openai-primary-runtime";
        };
        "unifi-plugins" = {
          last_updated = "2026-07-29T18:35:31Z";
          source_type = "git";
          source = "https://github.com/sirkirby/unifi-mcp.git";
          ref = "main";
        };
      };
      plugins = {
        "browser@openai-bundled" = {
          enabled = true;
        };
        "computer-use@openai-bundled" = {
          enabled = true;
        };
        "documents@openai-primary-runtime" = {
          enabled = true;
        };
        "pdf@openai-primary-runtime" = {
          enabled = true;
        };
        "spreadsheets@openai-primary-runtime" = {
          enabled = true;
        };
        "presentations@openai-primary-runtime" = {
          enabled = true;
        };
        "unifi-network@unifi-plugins" = {
          enabled = true;
        };
        "unifi-protect@unifi-plugins" = {
          enabled = true;
        };
        "unifi-access@unifi-plugins" = {
          enabled = true;
        };
      };
      mcp_servers = {
        zoo = {
          command = "uvx";
          args = ["zoo-mcp"];
          enabled = false;
          env_vars = ["ZOO_API_TOKEN"];
          startup_timeout_sec = 60;
        };
        unifi-network = {
          command = "${unifiMcp}/bin/unifi-mcp";
          args = ["network"];
          enabled = true;
          env_vars = ["UNIFI_HOST" "UNIFI_NETWORK_HOST"];
          startup_timeout_sec = 90;
        };
        unifi-protect = {
          command = "${unifiMcp}/bin/unifi-mcp";
          args = ["protect"];
          enabled = true;
          env_vars = ["UNIFI_HOST" "UNIFI_PROTECT_HOST"];
          startup_timeout_sec = 90;
        };
        unifi-access = {
          command = "${unifiMcp}/bin/unifi-mcp";
          args = ["access"];
          enabled = true;
          env_vars = ["UNIFI_HOST" "UNIFI_ACCESS_HOST"];
          startup_timeout_sec = 90;
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
      desktop = {
        followUpQueueMode = "steer";
      };
      projects = {
        "${homeDir}/life" = {
          trust_level = "trusted";
        };
        "${homeDir}/global-nix" = {
          trust_level = "trusted";
        };
        "${homeDir}/dotfiles" = {
          trust_level = "trusted";
        };
      };
    };
in {
  file = tomlFormat.generate "codex-config.toml" codexConfigAttrs;
  attrs = codexConfigAttrs;
}
