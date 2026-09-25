{
  pkgs,
  config,
}: let
  tomlFormat = pkgs.formats.toml {};
  homeDir = config.home.homeDirectory;
  isDarwin = pkgs.stdenv.hostPlatform.isDarwin;
  unifiMcp = pkgs.writeShellApplication {
    name = "unifi-mcp";
    runtimeInputs = [pkgs.jq pkgs.uv];
    text = builtins.readFile ../bin/unifi-mcp;
  };

  codexConfigAttrs =
    (pkgs.lib.optionalAttrs isDarwin {
      tui = {
        notifications = ["agent-turn-complete"];
        notification_condition = "unfocused";
        notification_method = "auto";
      };
      notify = [
        "${homeDir}/.codex/computer-use/Codex Computer Use.app/Contents/SharedSupport/SkyComputerUseClient.app/Contents/MacOS/SkyComputerUseClient"
        "turn-ended"
      ];
    })
    // {
      model = "gpt-6-astra";
      model_reasoning_effort = "xhigh";
      model_reasoning_summary = "auto";
      personality = "none";
      service_tier = "fast";
      file_opener = "none";
      cli_auth_credentials_store = "file";
      mcp_oauth_credentials_store = "file";
      show_raw_agent_reasoning = true;
      suppress_unstable_features_warning = true;
      web_search = "live";
      features = {
        browser_use = false;
        browser_use_external = true;
        # Messages needs this shared feature; the desktop-control plugin stays disabled.
        computer_use = true;
        fast_mode = true;
        guardian_approval = true;
        js_repl = false;
        multi_agent = true;
        memories = true;
        chronicle = false;
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
          enabled = false;
        };
        "chrome@openai-bundled" = {
          enabled = true;
        };
        "codex-app-tools@openai-bundled" = {
          enabled = isDarwin;
        };
        "computer-use@openai-bundled" = {
          enabled = false;
        };
        "unified-computer-use@openai-bundled" = {
          enabled = false;
        };
        "messages@openai-bundled" = {
          enabled = isDarwin;
        };
        "sites@openai-bundled" = {
          enabled = false;
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
        carta = {
          url = "https://mcp.app.carta.com/mcp";
        };
        copilot = {
          url = "https://mcp.copilot.money/mcp";
        };
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
      default_permissions = ":workspace";
      approval_policy = "on-request";
      approvals_reviewer = "auto_review";
      shell_environment_policy = {
        "inherit" = "all";
        ignore_default_excludes = true;
      };
      desktop = {
        followUpQueueMode = "steer";
        "daybreak-enabled".enabled = false;
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
