/*jshint esversion: 6 */

const commandLineUsage = require('command-line-usage');

module.exports = {

    afterUsage: () => {
        const sections = [{
                header: 'Congrats on generating your jBPM Business Application!',
                content: ''
            },
            {
                header: 'Links to get your started with your app:',
                content: 'Getting started Guide: http://jbpm.org/businessapps/gettingStarted.html\njBPM Homepage - jbpm.org\njBPM Blogs and Videos: mswiderski.blogspot.com'
            }
        ];
        const usage = commandLineUsage(sections);
        return usage;
    }
};