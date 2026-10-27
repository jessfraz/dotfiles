{
  config,
  lib,
  pkgs,
  ...
}: let
  cfg = config.programs.agent;
  tomlFormat = pkgs.formats.toml {};
  homeDir = config.home.homeDirectory;
  configPath = "${config.xdg.configHome}/agent/config.toml";
  defaults = lib.optionalAttrs (cfg.role == "coordinator") {
    model = {
      provider = "openai";
      model_id = "gpt-6.1-sol";
      reasoning = "high";
      fast = false;
    };
    context_repositories = ["~/life"];
    poll_interval_seconds = 60;
    sources = [
      {provider = "google";}
      {provider = "google_calendar";}
      {provider = "github";}
      {provider = "messages";}
      {
        provider = "slack";
        account = "work";
        command = ["uv" "run" "--project" "${homeDir}/life" "python" "${homeDir}/life/scripts/slack_read.py"];
      }
    ];
  };
  settingsFile = tomlFormat.generate "agent-managed-settings.toml" cfg.settings;
  apply = "${cfg.package}/bin/agent --config ${lib.escapeShellArg configPath} --json config apply ${settingsFile}";
in {
  options.programs.agent = {
    enable = lib.mkEnableOption "declarative non-secret agent preferences";
    package = lib.mkOption {
      type = lib.types.package;
      description = "Agent CLI supplied by the host configuration.";
    };
    role = lib.mkOption {
      type = lib.types.enum ["coordinator" "worker"];
      default = "coordinator";
      description = "Only the coordinator needs shared preference defaults.";
    };
    settings = lib.mkOption {
      type = tomlFormat.type;
      default = defaults;
      description = "Managed model, context repositories, sources and poll interval. Connection, trust and credentials stay in the existing private TOML.";
    };
  };

  config = lib.mkIf cfg.enable {
    home.packages = [cfg.package];
    home.activation.agentConfig = lib.hm.dag.entryAfter ["writeBoundary"] ''
      if [[ -n "''${DRY_RUN_CMD:-}" ]]; then
        $DRY_RUN_CMD ${apply}
      else
        agentApplyResult="$(${apply})"
        agentSettingsChanged="$(${pkgs.jq}/bin/jq -r '.changed' <<< "$agentApplyResult")"
        ${lib.optionalString pkgs.stdenv.hostPlatform.isDarwin ''
          if [[ "$agentSettingsChanged" == true ]]; then
            agentJob="gui/$(${pkgs.coreutils}/bin/id -u)/org.nixos.agent"
            if /bin/launchctl print "$agentJob" >/dev/null 2>&1; then
              /bin/launchctl kickstart -k "$agentJob"
            fi
          fi
        ''}
      fi
    '';
  };
}
