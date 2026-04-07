{
  pkgs,
  config,
}: let
  tomlFormat = pkgs.formats.toml {};
  homeDir = config.home.homeDirectory;
  configDir = "${homeDir}/.config";
  stateDir = name: "${configDir}/${name}";

  switchboardConfigAttrs = {
    secret = {
      github_personal_token = {
        kind = "onepassword_item";
        account = "my.1password.com";
        item = "GitHub Personal Access Token";
        field = "token";
      };

      google_personal_client_id = {
        kind = "onepassword_item";
        account = "my.1password.com";
        item = "gws cli";
        field = "username";
      };

      google_personal_client_secret = {
        kind = "onepassword_item";
        account = "my.1password.com";
        item = "gws cli";
        field = "credential";
      };

      google_work_client_id = {
        kind = "onepassword_item";
        account = "kittycadinc.1password.com";
        vault = "Employee";
        item = "gws cli";
        field = "username";
      };

      google_work_client_secret = {
        kind = "onepassword_item";
        account = "kittycadinc.1password.com";
        vault = "Employee";
        item = "gws cli";
        field = "credential";
      };

      schwab_personal_client_id = {
        kind = "onepassword_item";
        account = "my.1password.com";
        item = "schwab cli";
        field = "username";
      };

      schwab_personal_client_secret = {
        kind = "onepassword_item";
        account = "my.1password.com";
        item = "schwab cli";
        field = "credential";
      };
    };

    auth = {
      github_personal = {
        provider = "github";
        kind = "github_token";
        account = "jessfraz";
        token = "github_personal_token";
      };

      google_personal = {
        provider = "google";
        kind = "google_oauth";
        account = "me@jessfraz.com";
        client_id = "google_personal_client_id";
        client_secret = "google_personal_client_secret";
      };

      google_work = {
        provider = "google";
        kind = "google_oauth";
        account = "jess@zoo.dev";
        client_id = "google_work_client_id";
        client_secret = "google_work_client_secret";
      };

      schwab_personal = {
        provider = "schwab";
        kind = "schwab_cli";
        account = "jessfraz";
        client_id = "schwab_personal_client_id";
        client_secret = "schwab_personal_client_secret";
      };
    };

    namespace = {
      github.personal = {
        provider = "github";
        account = "jessfraz";
        auth = "github_personal";
        default_read = true;
        state_dir = stateDir "gh";
      };

      google.work = {
        provider = "google";
        account = "jess@zoo.dev";
        auth = "google_work";
        default_read = true;
        state_dir = stateDir "gws-work";
      };

      google.personal = {
        provider = "google";
        account = "me@jessfraz.com";
        auth = "google_personal";
        default_read = false;
        state_dir = stateDir "gws-personal";
      };

      mychart.ucla = {
        provider = "mychart";
        account = "UCLA Health";
        state_dir = stateDir "mychart-ucla";
      };

      schwab.personal = {
        provider = "schwab";
        account = "jessfraz";
        auth = "schwab_personal";
        default_read = true;
        state_dir = stateDir "schwab-personal";
      };
    };
  };
in {
  file = tomlFormat.generate "switchboard-config.toml" switchboardConfigAttrs;
  attrs = switchboardConfigAttrs;
}
