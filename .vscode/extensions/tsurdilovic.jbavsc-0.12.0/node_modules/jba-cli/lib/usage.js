/*jshint esversion: 6 */

const commandLineUsage = require('command-line-usage');

module.exports = {

    showUsage: () => {
        const sections = [{
                header: 'jBPM Business Applications CLI',
                content: 'CLI to generate jBPM Business Applications. For more information see jbpm.org. To generate a jBPM Business Application online use start.jbpm.org'
            },
            {
                header: 'Usage',
                content: 'Go to a directory where your zip should be created, then run the gen command as described below.'
            },
            {
                header: 'Synopsis',
                content: '$ jba <command> <options>'
            },
            {
                header: 'Command List',
                content: [{
                    name: 'gen',
                    summary: 'Generate a new jBPM Business Application'
                }]
            },
            {
                header: 'Options',
                optionList: [{
                        name: 'quick',
                        description: 'Quick generation using default values. Will not prompt for user input during generation process.'
                    },
                    {
                        name: 'site',
                        description: 'Site to generate from (optional), \nexample: jba gen --site=http://my.site.com/gen.\nDefault is http://start.jbpm.org/gen'
                    },
                    {
                        name: 'unzip',
                        description: 'If specified the generated business app zip will be unzipped in the current directory. By default the zip is not unzipped'
                    }
                ]
            }
        ];
        const usage = commandLineUsage(sections);
        return usage;
    }
};