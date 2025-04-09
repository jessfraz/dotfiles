{
  description = "Home Manager module for jessfraz's dotfiles";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    unstable.url = "nixpkgs/nixos-unstable";

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "unstable";
    };
  };

  outputs = {
    self,
    nixpkgs,
    unstable,
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
      ];

      home.file = {
        ".aliases".source = ./.aliases;
        ".bash_prompt".source = ./.bash_prompt;
        ".dockerfunc".source = ./.dockerfunc;
        ".exports".source = ./.exports;
        ".functions".source = ./.functions;
        ".inputrc".source = ./.inputrc;
        ".irssi".source = mkIfExists ./.irssi;
        ".nixbash".source = ./.nixbash;
        ".path".source = ./.path;
      };
    };

    # Optional: Provide buildable homeConfigurations for testing
    homeConfigurations = forAllSystems (
      system:
        home-manager.lib.homeManagerConfiguration {
          pkgs = import nixpkgs {inherit system;};
          modules = [self.homeManagerModules.default];
        }
    );
  };
}
