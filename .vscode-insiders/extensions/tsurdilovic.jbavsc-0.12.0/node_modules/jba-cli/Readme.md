jBPM Business Applications CLI
==============================

Package used to generate jBPM Business Applications. 
It uses start.jbpm.org to generate the business app zip and store it
in the folder where the "jba" command is run. It is also possible to 
unzip the generated business app into the current working directory.

How to install
==============================
1. From npm: 
```
npm install jba-cli -g
```
2. From GitHub
```
git clone git@github.com:BootstrapJBPM/jba-cli.git
cd jba-cli
npm install -g
```
How to update to latest version
==============================
This will update to latest version published on npmjs.com
```
npm update -g jba-cli
```

How to run
==============================
![JBA Usage](img/jbareadme.png?raw=true)


Sample execution
==============================
Default execution using the gen command. This will prompt user for inputs.

```
jba gen
```

![JBA Usage](img/jbausage.png?raw=true)

Sample execution with quick option
==============================
Quick option used default values, no user input will be asked.

```
jba gen --quick
```

![JBA Usage](img/jbausagequick.png?raw=true)

Sample execution with unzipping
==============================
Using the unzip option will unzip the business app into the current directory after generating it. The generated zip file will not be removed

```
jba gen --unzip
```

![JBA Usage](img/jbausageunzip.png?raw=true)
