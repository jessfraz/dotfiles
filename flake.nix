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
    homeManagerModules.default = {
      pkgs,
      config,
      lib,
      ...
    }: let
      mkIfExists = path:
        if builtins.pathExists path
        then path
        else pkgs.emptyFile;
      mkWritableConfig = relativePath: file: let
        targetPath = "${config.home.homeDirectory}/${relativePath}";
      in
        lib.hm.dag.entryAfter ["writeBoundary"] ''
          $DRY_RUN_CMD ${pkgs.coreutils}/bin/mkdir -p ${builtins.dirOf targetPath}
          $DRY_RUN_CMD ${pkgs.coreutils}/bin/rm -f ${targetPath}
          $DRY_RUN_CMD ${pkgs.coreutils}/bin/install -m 0644 ${file} ${targetPath}
        '';
      codexCfg = import ./nix/codex-config.nix {inherit pkgs config;};
      switchboardCfg = import ./nix/switchboard-config.nix {inherit pkgs config;};
    in {
      home.packages = with pkgs;
        [
          irssi
        ]
        ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
          terminal-notifier # needed for notify.py for codex
        ];

      home.file = let
        baseFiles = {
          ".aliases".source = ./.aliases;
          ".claude/CLAUDE.md".source = ./.codex/AGENTS.md;
          ".bash_prompt".source = ./.bash_prompt;
          ".codex/notify.py".source = ./.codex/notify.py;
          ".codex/AGENTS.md".source = ./.codex/AGENTS.md;
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
      home.activation = {
        codexConfigWritable = mkWritableConfig ".codex/config.toml" codexCfg.file;
        switchboardConfigWritable = mkWritableConfig ".config/switchboard/config.toml" switchboardCfg.file;
      };
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
