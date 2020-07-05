## Version History [![Changelog Status](https://changelogs.md/img/changelog-check-green.svg)](https://changelogs.md/github/nathanpeck/clui/)

### [0.3.6] - 2017-6-15

Progress bar now can print percentage progressBars when passing in a single value in update().

### [0.3.5] - 2017-6-15

Progress and Gauge bars will also show the correct length when value/currentValue is <= 0. Updated examples to include new clear() function. Spinner will clear the line after each draw loop so that shorter update messages will render correctly.

### [0.3.4] - 2017-6-15

Added new clear() function to CLI. Used to cleanly clear the screen and reduce flickering.

### [0.3.3] - 2017-6-13

Updated incorrect method signature from 'update' to 'message' in the Spinner example.

### [0.3.2] - 2017-6-12

Updated README.md with some missing/incorrect dependency references for cli-color and clui.

### [0.3.1] - 2014-10-08

Adding Line.contents() for fetching the contents of a line as a string.

### [0.2.0] - 2014-06-02

Fixed a crash caused by inability to locate the required trim helper in the latest version of cli-color. (And locked down the version of the cli-color dependency to stop this from ever happening again.)

### [0.2.1] - 2014-06-02

Removed lodash as a dependency in favor of vanilla JS, to keep installs faster and smaller than ever.

### [0.1.0] - 2014-04-06

Initial release
