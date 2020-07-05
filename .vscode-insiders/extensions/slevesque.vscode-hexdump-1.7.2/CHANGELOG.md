# Changelog

## [1.7.0] 2018-10-08
* Copy selection in different formats (#41, #43, #47)
* Add support for multi byte edit (#42, #45, thanks @noam787)
* Fix `exportToFile` (#46)
* Search a HEX string in the file (#48, thanks @jinliming2)

## [1.6.0] 2017-10-29
* Split code into files
* Better handling of large files
* Change `maxLineCount` to `sizeDisplay`
* New icon

## [1.5.0] 2017-10-25
* Use Open and Save dialog
* Fix images in documentation

## [1.4.0] 2017-07-02
* Upgrade to `hexy` v0.2.10
* `nibbles` can now be 8 (#30)
* Minor stability fix (#29)

## [1.3.0] 2017-04-19
* Colorize modified bytes (#28)
* Use enums for `nibbles` and `width`

## [1.2.2] 2017-04-12
* Better support for UNC path (#25)

## [1.2.1] 2017-03-12
* Make Hexdump button optional
* Display Hexdump button only on file (#21)
* Toggle between file and hexdump when possible (#20)

## [1.2.0] 2017-03-06
* Hover a selection to display as string in the Hex Inspector (#14)
* 'Search string' command (#19)
* Prefill 'Show Hexdump' with active file (#20)

## [1.1.4] 2016-11-18

* Split 'save' and 'export to file'
* Marked when (modified) in the status bar (#13)

## [1.1.3] 2016-11-17

* Optional Hex Inspector

## [1.1.2] 2016-11-06

* Customizable value for size warning and line count (#9)
* Add icon to title context menu (#10)
* Command text and changelog update (#11, #12, thanks @david-russo)

## [1.1.1] 2016-10-25

* Add color to the Hex Inspector
* Improve support for large files

## [1.0.1] 2016-10-18

* Fix an issue with syntax colorization

## [1.0.0] 2016-10-10

* Update if file changes (#2, #3, thanks @camwar11)
* Switch to [hexy.js](https://www.npmjs.com/package/hexy) (#4, thanks @boguscoder)
* Highlight selection in both hex and ascii sections (#6)
* More display options (see Configuration) (#5, #7)

## [0.1.1] 2016-08-17

* Add screenshots to README.md

## [0.1.0] 2016-08-17

* Hover to display data values
* Command to toggle between little and big endianness
* Status bar to indicate current endianness

## [0.0.2] 2016-07-12

* Edit value under cursor
* Syntax colorization
* Commands in context menus
* Go to address
* Export to file

## [0.0.1] 2016-06-01

* Display a specified file in hexadecimal

[1.7.0]: https://github.com/stef-levesque/vscode-hexdump/compare/7d60017fc919a2ecaecdf52ce51f2ac9da44d361...f8deab7bb875552746a61922bdfbbdd8401988f2
[1.6.0]: https://github.com/stef-levesque/vscode-hexdump/compare/72e52e914030e7c2631549e353c4e005b63a06f3...7b6271ac0db73a818c58bce7b4fcf1e23f72f02b
[1.5.0]: https://github.com/stef-levesque/vscode-hexdump/compare/bd4389ef5d9970c2829cd004fc35c55f60bbd9c6...208314e9224bf304227131f81201f99bc4152bf0
[1.4.0]: https://github.com/stef-levesque/vscode-hexdump/compare/8502eb756e5bcc49d5dbe17af682dae064c8d7ad...3da7bef847a3a96249d5164c5e1c114de0546fac
[1.3.0]: https://github.com/stef-levesque/vscode-hexdump/compare/151ae3929eb66ff49c75568a1dabb4b6794ace5d...02ba787cc607c56de97365bbca8b479f5ba5a0cb
[1.2.2]: https://github.com/stef-levesque/vscode-hexdump/compare/a07ac0271fe3d131bd8c88f4723b2cddbafe8362...5941fbb1a3ef4db0292127a61922d294a59da571
[1.2.1]: https://github.com/stef-levesque/vscode-hexdump/compare/9b37fcd945fd03596bde8e7f53779abb762df026...c4c18df738b7b0ca5c791fd162f26cdb5eb907d4
[1.2.0]: https://github.com/stef-levesque/vscode-hexdump/compare/91523b450d325917195410f327e5df63d11bb4cf...5c61d2a044d183c6ac7ad3facc43073412672bc8
[1.1.4]: https://github.com/stef-levesque/vscode-hexdump/compare/027e5f37a14549e0d9ff80ffac0fe09ce1476cbc...38e26457cc0be4fb3611a3512fd32325c2233d89
[1.1.3]: https://github.com/stef-levesque/vscode-hexdump/compare/4777ef7b5429dd6df11b9698ff2930e772c73bb3...572a5db319319e7df739e9537991a3b168d295e3
[1.1.2]: https://github.com/stef-levesque/vscode-hexdump/compare/3f6b4fa8af24daeccfbd9c1c200fe221e1e8f712...45b01d077b3a6ad9cb2666bdeeb31b89b42a838d
[1.1.1]: https://github.com/stef-levesque/vscode-hexdump/compare/802b67edbe33af050315bb953fc1ce2c69b6ffc7...ff198785736dc683be10ceca85ed1b114b151e11
[1.0.1]: https://github.com/stef-levesque/vscode-hexdump/compare/0fba91206d32dcc01d31a6fd2a544fc6b5e0c26f...fd688a793d63e2cf76b3c169510c4d598cf180dc
[1.0.0]: https://github.com/stef-levesque/vscode-hexdump/compare/dcb67df9426583a9968888bbe7ce83a823e2e592...52e55624cb105501c5aee169a9cfd6d4c769949b
[0.1.1]: https://github.com/stef-levesque/vscode-hexdump/compare/82d035ae76ca09293f13a60df6bc6da8adf4302a...ff9e1658aa4205d49520d4a0bd5043c027ed98a4
[0.1.0]: https://github.com/stef-levesque/vscode-hexdump/compare/47ae52ae080a531910c1fb9da736f1194d9af5ac...75b1bb35a09a0f87de464a74a51e96099ff90225
[0.0.2]: https://github.com/stef-levesque/vscode-hexdump/compare/ba05da59122e25f39fbcaa39b82e98b7f1f3022e...8cfee8b0398313ca58120ec9d19c38c384042536
[0.0.1]: https://github.com/stef-levesque/vscode-hexdump/commit/ba05da59122e25f39fbcaa39b82e98b7f1f3022e
