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
    homeManagerModules.default = {pkgs, ...}: let
      mkIfExists = path:
        if builtins.pathExists path
        then path
        else pkgs.emptyFile;
    in {
      home.packages = with pkgs; [
        irssi
      ];

      home.file = let
        baseFiles = {
          ".aliases".source = ./.aliases;
          ".bash_prompt".source = ./.bash_prompt;
          ".codex/config.toml".source = ./.codex/config.toml;
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
