<h1 align="center">
  <br>
    <img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/logo.png" alt="logo" width="200">
  <br><br>
  Material Icon Theme
  <br>
  <br>
</h1>

<h4 align="center">Get the Material Design icons into your VS Code.</h4>

<p align="center">
    <a href="https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme"><img src="https://vsmarketplacebadge.apphb.com/version-short/pkief.material-icon-theme.svg?style=for-the-badge&colorA=252526&colorB=43A047&label=VERSION" alt="Version"></a>&nbsp;
    <a href="https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme"><img src="https://vsmarketplacebadge.apphb.com/rating-short/pkief.material-icon-theme.svg?style=for-the-badge&colorA=252526&colorB=43A047&label=Rating" alt="Rating"></a>&nbsp;
    <a href="https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme"><img src="https://vsmarketplacebadge.apphb.com/installs-short/PKief.material-icon-theme.svg?style=for-the-badge&colorA=252526&colorB=43A047&label=Installs" alt="Installs"></a>&nbsp;
    <a href="https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme"><img src="https://vsmarketplacebadge.apphb.com/downloads-short/PKief.material-icon-theme.svg?style=for-the-badge&colorA=252526&colorB=43A047&label=Downloads" alt="Downloads"></a>
</p>

### File icons

<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/images/fileIcons.png" alt="file icons">

### Folder icons

<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/images/folderIcons.png" alt="folder icons">

#### Customize folder color

You can change the color of the default folder icon using the command palette:

<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/images/set-folder-color.gif" alt="custom folder colors">

or via user settings:

```json
"material-icon-theme.folders.color": "#ef5350",
```

#### Folder themes

You can change the design of the folder icons using the command palette:

<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/images/set-folder-theme.gif" alt="folder themes">

or via user settings:

```json
"material-icon-theme.folders.theme": "specific"
```

## Custom icon opacity

You can set a custom opacity for the icons:

```json
"material-icon-theme.opacity": 0.5
```

## Custom icon saturation

If colors do not make you happy you can change the icons to have less saturation making them look grayish or completely grayscale by setting saturation to 0:

```json
"material-icon-theme.saturation": 0.5
```

## Custom icon associations

You can customize the icon associations directly in the user settings.

### File associations

With the `*.[extension]` pattern you can define custom file icon associations. For example you could define an icon for `*.sample` and every file that ends with `.sample` will have the defined icon.  Use `**.[extension]` with two asterisks to apply the file association also for the filenames ending with that file extension. 

If there's no leading `*` it will be automatically configured as filename and not as file extension.

```json
"material-icon-theme.files.associations": {
    "*.ts": "typescript",
    "fileName.ts": "angular"
}
```

### Folder associations

The following configuration can customize the folder icons. It is also possible to overwrite existing associations and create nice combinations. For example you could change the folder theme to "classic" and define icons only for the folder names you like.

```json
"material-icon-theme.folders.associations": {
    "customFolderName": "src",
    "sample": "dist"
}
```

### Language associations

With the following configuration you can customize the language icons. It is also possible to overwrite existing associations.

```json
"material-icon-theme.languages.associations": {
    "languageId": "iconName",
    "json": "json"
}
```

Available language ids: 

https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers

You can see the available icon names in the overview above.

## One-click activation

After installation or update you can click on the 'Activate'-button to activate the icon theme, if you haven't already. The icons will be visible immediately.

<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/images/oneclickactivation.png" alt="activation">

## Commands

Press `Ctrl-Shift-P` to open the command palette and type `Material Icons`.

<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/images/commandPalette.png" alt="commands">

<p></p>

| Command                             | Description                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| **Activate Icon Theme**             | Activate the icon theme.                                                                |
| **Change Folder Color**             | Change the color of the folder icons.                                                   |
| **Change Folder Theme**             | Change the design of the folder icons.                                                  |
| **Change Opacity**                  | Change the opacity of the icons.                                                        |
| **Change Saturation**               | Change the saturation value of the icons.                                               |
| **Configure Icon Packs**            | Select an icon pack that enables additional icons (e.g. for Angular, React, Ngrx).      |
| **Hide Folder Arrows**              | Hides the arrows next to the folder icons.                                              |
| **Restore Default Configuration**   | Reset the default configurations of the icon theme.                                     |
| **Toggle Grayscale**                | Sets the saturation of the icons to zero, so that they are grayscale.                   |

## Icon sources

* [Material Design Icons](https://materialdesignicons.com/)
* official icons

## Contributors

<a href="https://github.com/PKief/vscode-material-icon-theme/graphs/contributors">
    <img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/images/contributors.png" alt="Contributors">
</a>

**Would you like to contribute?**

Take a look at the [contribution guidelines](https://github.com/PKief/vscode-material-icon-theme/blob/master/CONTRIBUTING.md) and open a [new issue](https://github.com/PKief/vscode-material-icon-theme/issues) or [pull request](https://github.com/PKief/vscode-material-icon-theme/pulls) on GitHub.
