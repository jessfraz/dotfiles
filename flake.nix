{
  description = "Home Manager module for jessfraz's dotfiles";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    home-manager,
    ...
  }: let
    supportedSystems = ["x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin"];

    forAllSystems = f:
      builtins.listToAttrs (map (system: {
          name = system;
          value = f system;
        })
        supportedSystems);
  in {
    homeManagerModules.default = {pkgs, config, ...}: let
      mkIfExists = path:
        if builtins.pathExists path
        then path
        else pkgs.emptyFile;
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
      writableRootsToml = builtins.concatStringsSep ",\n  " (map (p: "\"${p}\"") writableRoots);
      codexConfig = ''
model_reasoning_effort = "high"
model_reasoning_summary = "detailed"
file_opener = "none"
show_raw_agent_reasoning = true
${if isDarwin then ''
notify = ["python3", "${homeDir}/.codex/notify.py"]
'' else ""}

[tools]
web_search = true

sandbox_mode = "workspace-write"
approval_policy = "on-request"   # The model decides when to escalate the approval

# Extra settings that only apply when `sandbox = "workspace-write"`.
[sandbox_workspace_write]
# Allow the command being run inside the sandbox to make outbound network
# requests. Disabled by default.
# Stop getting prompted when your tests running want to access the internet or when its trying to curl outside documentation.
network_access = true
# Permanently allow writes to global caches:
writable_roots = [
  ${writableRootsToml}
]

[shell_environment_policy]
inherit = "all"                # This is the default value. Inherit all environment variables.
ignore_default_excludes = true # Do not ignore any environment variables by default, allows it to see shit like tokens, which if you are running tests and it needs variables you will want.
'';
    in {
      home.packages = with pkgs; [
        irssi
      ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
        terminal-notifier
      ];

      home.file = let
        baseFiles = {
          ".aliases".source = ./.aliases;
          ".bash_prompt".source = ./.bash_prompt;
          ".codex/config.toml".text = codexConfig;
          ".codex/notify.py".source = ./.codex/notify.py;
          ".dockerfunc".source = ./.dockerfunc;
          ".exports".source = ./.exports;
          ".functions".source = ./.functions;
          ".gitignore".source = ./gitignore;
          ".inputrc".source = ./.inputrc;
          ".irssi".source = mkIfExists ./.irssi;
          ".nixbash".source = ./.nixbash;
        };

        linuxOnlyFiles = {
          ".i3".source = mkIfExists ./.i3;
          ".urxvt".source = mkIfExists ./.urxvt;
          ".Xdefaults".source = ./.Xdefaults;
          ".Xprofile".source = ./.Xprofile;
          ".Xresources".source = ./.Xresources;
          ".xsessionrc".source = ./.xsessionrc;
        };
      in
        if pkgs.stdenv.isLinux
        then baseFiles // linuxOnlyFiles
        else baseFiles;
    };

    homeConfigurations = forAllSystems (
      system:
        home-manager.lib.homeManagerConfiguration {
          pkgs = import nixpkgs {inherit system;};
          modules = [self.homeManagerModules.default];
        }
    );
  };
}
