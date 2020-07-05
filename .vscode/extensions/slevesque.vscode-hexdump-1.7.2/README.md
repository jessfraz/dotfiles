# vscode-hexdump

[![GitHub issues](https://img.shields.io/github/issues/stef-levesque/vscode-hexdump.svg)](https://github.com/stef-levesque/vscode-hexdump/issues)
[![GitHub license button](https://img.shields.io/github/license/stef-levesque/vscode-hexdump.svg)](https://github.com/stef-levesque/vscode-hexdump/blob/master/LICENSE.md)
[![VS Code marketplace button](https://vsmarketplacebadge.apphb.com/installs/slevesque.vscode-hexdump.svg)](https://marketplace.visualstudio.com/items?itemName=slevesque.vscode-hexdump)
[![Gitter chat button](https://img.shields.io/gitter/room/stef-levesque/vscode-hexdump.svg)](https://gitter.im/stef-levesque/vscode-hexdump)

hexdump for Visual Studio Code

## Description

Display a specified file in hexadecimal

## Main Features

Right-click on a file in the explorer to see *Show Hexdump*  
![Show hexdump](https://github.com/stef-levesque/vscode-hexdump/raw/master/images/show-hexdump.png)

Hover in the data section to see numerical values  
![Hover DataView](https://github.com/stef-levesque/vscode-hexdump/raw/master/images/hover-dataview.png)

Hover a selection to preview it as a string  
![Hover String](https://github.com/stef-levesque/vscode-hexdump/raw/master/images/hover-string.png)

Right-click in the hexdump to see more options  
![Context Menu](https://github.com/stef-levesque/vscode-hexdump/raw/master/images/context-menu.png)

Colorize modified bytes  
![Modified Bytes](https://github.com/stef-levesque/vscode-hexdump/raw/master/images/modified-bytes.png)

*Show Hexdump* button  
![Title Icon](https://github.com/stef-levesque/vscode-hexdump/raw/master/images/title-icon.png)

## Commands

* `hexdumpFile` (`ctrl+shift+alt+h`, `cmd+shift+alt+h`) Show Hexdump for the current file
* `hexdumpPath` Show Hexdump for a specific path
* `hexdumpOpen` Show Hexdump for a file selected in an Open dialog
* `editValue` (`shift+enter`) Edit Value Under Cursor
* `gotoAddress` (`ctrl+g`) Go to Address...
* `exportToFile` (`ctrl+shift+s`, `cmd+shift+s`) Export to Binary File...
* `save` (`ctrl+s`, `cmd+s`) Save file
* `searchString` (`ctrl+f`, `cmd+f`) Search String in File
* `searchHex` (`ctrl+alt+f`, `cmd+alt+f`) Search Hex String in File
* `copyAsFormat` (`ctrl+alt+c`, `cmd+alt+c`) Copy the selection in a specific format

## Configuration

* `hexdump.littleEndian` Set default endianness (true for little endian, false for big endian)
* `hexdump.nibbles` How many nibbles per group (2, 4, 8)
* `hexdump.uppercase` Display hex digits in uppercase
* `hexdump.width` Number of bytes per line (8, 16, 32)
* `hexdump.showOffset` Show offset on first line
* `hexdump.showAddress` Show address on each line
* `hexdump.showAscii` Show ASCII section
* `hexdump.showInspector` Show Hex Inspector when hovering data
* `hexdump.sizeWarning` Display a warning if file is larger than this
* `hexdump.sizeDisplay` Maximum size of the buffer to display
* `hexdump.charEncoding` Identify the source character encoding
* `hexdump.btnEnabled` Display Hexdump button

## Installation

1. Install *Visual Studio Code* (1.17.0 or higher)
2. Launch *Code*
3. From the command palette `ctrl+shift+p` (Windows, Linux) or `cmd+shift+p` (OS X)
4. Select `Install Extension`
5. Choose the extension `hexdump for VSCode`
6. Reload *Visual Studio Code*

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Requirements

Visual Studio Code v1.17.0

## Credits

* [Visual Studio Code](https://code.visualstudio.com/)
* [vscode-docs on GitHub](https://github.com/Microsoft/vscode-docs)
* [hexdump-nodejs on GitHub](https://github.com/bma73/hexdump-nodejs)
* [hexy.js on GitHub](https://github.com/a2800276/hexy.js)
* [iconv-lite on GitHub](https://github.com/ashtuchkin/iconv-lite)
* [Clipboardy on GitHub](https://github.com/sindresorhus/clipboardy)
* [nrf-intel-hex on GitHub](https://github.com/NordicSemiconductor/nrf-intel-hex)

## License

[MIT](https://github.com/stef-levesque/vscode-hexdump/blob/master/LICENSE.md)
