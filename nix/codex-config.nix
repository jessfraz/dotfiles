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
      service_tier = "fast";
      file_opener = "none";
      show_raw_agent_reasoning = true;
      suppress_unstable_features_warning = true;
      web_search = "live";
      features = {
        fast_mode = true;
        multi_agent = true;
        memories = true;
        chronicle = true;
      };
      # The Codex runtime owns volatile refresh timestamps for these local sources.
      marketplaces = {
        "openai-bundled" = {
          source_type = "local";
          source = "${homeDir}/.codex/.tmp/bundled-marketplaces/openai-bundled";
        };
        "openai-primary-runtime" = {
          source_type = "local";
          source = "${homeDir}/.cache/codex-runtimes/codex-primary-runtime/plugins/openai-primary-runtime";
        };
      };
      plugins = {
        "browser@openai-bundled" = {
          enabled = true;
        };
        "chrome@openai-bundled" = {
          enabled = true;
        };
        "computer-use@openai-bundled" = {
          enabled = isDarwin;
        };
        "sites@openai-bundled" = {
          enabled = true;
        };
        "visualize@openai-bundled" = {
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
        "template-creator@openai-primary-runtime" = {
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
          enabled = false;
          env = {
            UNIFI_NETWORK_HOST = "192.168.1.1";
          };
          startup_timeout_sec = 90;
        };
        unifi-protect = {
          command = "${unifiMcp}/bin/unifi-mcp";
          args = ["protect"];
          enabled = false;
          env = {
            UNIFI_PROTECT_HOST = "192.168.1.140";
          };
          startup_timeout_sec = 90;
        };
        unifi-access = {
          command = "${unifiMcp}/bin/unifi-mcp";
          args = ["access"];
          enabled = false;
          env = {
            UNIFI_ACCESS_HOST = "192.168.1.140";
          };
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
        "${homeDir}" = {
          trust_level = "trusted";
        };
        "${homeDir}/dotfiles" = {
          trust_level = "trusted";
        };
        "${homeDir}/global-nix" = {
          trust_level = "trusted";
        };
        "${homeDir}/life" = {
          trust_level = "trusted";
        };
        "${homeDir}/zoo/api" = {
          trust_level = "trusted";
        };
        "${homeDir}/zoo/cio" = {
          trust_level = "trusted";
        };
        "${homeDir}/zoo/ciso" = {
          trust_level = "trusted";
        };
        "${homeDir}/zoo/infra" = {
          trust_level = "trusted";
        };
      };
    };
in {
  file = tomlFormat.generate "codex-config.toml" codexConfigAttrs;
  attrs = codexConfigAttrs;
}
