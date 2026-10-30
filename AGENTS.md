# Managed configuration

- Change Nix, nix-darwin, and Home Manager configuration in its owning repository source. Never edit, replace, or unlink the live managed file out of band,
  even when it is writable. Trace the file to its source in this repo or a sibling repo such as `../global-nix` before changing it.
- Handle file collisions and migrations in the configuration. When replacement is intended, set `force = true` on the specific `home.file` or
  `xdg.configFile` entry rather than manually removing or moving the live file to get activation past the error.
- Apply changes through the normal host rebuild or Home Manager activation when authorized. Otherwise, give the exact command for the user to run.
  State whether the change is only in source or has been activated; do not make a temporary live edit to simulate activation.
