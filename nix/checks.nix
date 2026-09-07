{
  pkgs,
  homeConfiguration,
  exports,
}: {
  home = homeConfiguration.activationPackage;

  editor =
    pkgs.runCommand "dotfiles-editor-check" {
      nativeBuildInputs = [pkgs.bash pkgs.neovim-unwrapped pkgs.which];
    } ''
      HOME="$TMPDIR" bash --noprofile --norc -euc '
        source "$1"
        "$EDITOR" --headless -u NONE -i NONE +quit
      ' -- ${exports}
      touch "$out"
    '';
}
