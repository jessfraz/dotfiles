# History

## v1.2.1 2016 May 10
- Use down interfaces as well as up interfaces
	- Thanks to [Ted Shroyer](https://github.com/tedshroyer) for [pull request #15](https://github.com/bevry/getmac/pull/15)

## v1.1.0 2016 May 10
- Updated dependencies
- Repackaged

## v1.0.7 2015 March 5
- Added fix for iproute2 commands in absence of ifconfig on Linux machines

## v1.0.6 2013 October 27
- Repackaged

## v1.0.5 2013 September 2
- Will now ignore zero-filled mac addresses and error if none are found
	- Thanks to [Uwe Klawitter](https://github.com/uklawitter) for [issue #1](https://github.com/bevry/getmac/issues/1)
- Can now pass an optional object as the first argument to `getmac` that can contain `data` as a String to scan instead of executing the appropriate command to fetch the data
- Dependency updates

## v1.0.4 2013 February 12
- Better compatibility with linux distros

## v1.0.3 2013 February 12
- Minor optimisation

## v1.0.2 2013 February 12
- Fixed windows support, turns out they format mac addresses differently

## v1.0.1 2013 February 12
- Renamed `getmac` executable to `getmac-node` to avoid conflict on windows

## v1.0.0 2013 February 12
- Initial working commit
