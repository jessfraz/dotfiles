{
  pkgs,
  config,
}: let
  tomlFormat = pkgs.formats.toml {};
  homeDir = config.home.homeDirectory;
  configDir = "${homeDir}/.config";
  stateDir = name: "${configDir}/${name}";
  credentialProfiles = {
    personal = "6f2yinpr4l6tp3qctbinvb3cky";
  };
  credential = profile: item: field: {
    kind = "onepassword_item";
    account = "my.1password.com";
    auth_profile = profile;
    vault = credentialProfiles.${profile};
    inherit item field;
  };

  switchboardConfigAttrs = {
    one_password.profiles =
      builtins.mapAttrs (name: _: {
        token_file = "${configDir}/agent-credentials/${name}.token";
      })
      credentialProfiles;
    secret = {
      phone_api_key = credential "personal" "3hyv46ywjea2rl5xbhg2xsyc5e" "api_key";
      phone_api_secret = credential "personal" "3hyv46ywjea2rl5xbhg2xsyc5e" "api_secret";
      phone_model_api_key = credential "personal" "3hyv46ywjea2rl5xbhg2xsyc5e" "model_api_key";
      github_personal_token = credential "personal" "xpm367ibuwilt4ocp63ht5cppq" "token";
      schwab_personal_client_id = credential "personal" "nyf64ypiujz6gqvrpgfj46wnbm" "username";
      schwab_personal_client_secret = credential "personal" "nyf64ypiujz6gqvrpgfj46wnbm" "credential";
    };

    auth = {
      phone_personal = {
        provider = "phone";
        kind = "phone_cli";
        account = "personal";
        api_key = "phone_api_key";
        api_secret = "phone_api_secret";
        model_api_key = "phone_model_api_key";
      };

      github_personal = {
        provider = "github";
        kind = "github_token";
        account = "jessfraz";
        token = "github_personal_token";
      };

      google_personal = {
        provider = "google";
        kind = "google_cli";
        account = "me@jessfraz.com";
      };

      google_work = {
        provider = "google";
        kind = "google_cli";
        account = "jess@zoo.dev";
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
      phone.personal = {
        provider = "phone";
        account = "personal";
        auth = "phone_personal";
        default_read = false;
        state_dir = "${homeDir}/.local/share/switchboard/namespaces/phone.personal";
      };

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
