## Releasing

- make sure the CHANGELOG.md entries are up-to-date
- rev. the CHANGELOG.md version for the release to the anticipated version
  number
- install the `vsce` tool (see
  https://code.visualstudio.com/docs/extensions/publish-extension)
- run `vsce publish patch` (or `minor` for minor releases); as part of this, the
  plugin version in package.json will be autimatically updated
