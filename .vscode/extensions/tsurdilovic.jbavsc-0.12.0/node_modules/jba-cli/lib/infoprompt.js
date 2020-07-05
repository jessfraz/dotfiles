/*jshint esversion: 6 */

const inquirer = require('inquirer');

module.exports = {

    askAppCredentials: () => {
        const questions = [{
                name: 'capabilities',
                type: 'list',
                message: 'Enter Application Type:',
                default: 'bpm',
                choices: [{
                        name: 'Business Automation',
                        value: 'bpm'
                    },
                    {
                        name: 'Decision Management',
                        value: 'brm'
                    },
                    {
                        name: 'Business Optimization',
                        value: 'planner'
                    }
                ],
                validate: function (value) {
                    if (value.length) {
                        return true;
                    } else {
                        return 'Please enter valid Application Type..';
                    }
                }
            },
            {
                name: 'packagename',
                type: 'input',
                message: 'Enter Package Name:',
                default: 'com.company',
                validate: function (value) {
                    if (value.length) {
                        return true;
                    } else {
                        return 'Please enter package name.';
                    }
                }
            },
            {
                name: 'name',
                type: 'input',
                message: 'Enter Application Name:',
                default: 'business-application',
                validate: function (value) {
                    if (value.length) {
                        return true;
                    } else {
                        return 'Please enter application name.';
                    }
                }
            },
            {
                name: 'version',
                type: 'input',
                message: 'Enter KIE Version (leave blank for latest):',
                default: ''
            },
            {
                name: 'options',
                type: 'checkbox',
                message: 'Enter Application Components:',
                default: ['kjar', 'model', 'service'],
                choices: [{
                        name: 'Business Assets',
                        value: 'kjar'
                    },
                    {
                        name: 'Dynamic Assets',
                        value: 'dkjar'
                    },
                    {
                        name: 'Data Model',
                        value: 'model'
                    },
                    {
                        name: 'Service',
                        value: 'service'
                    }
                ],
                validate: function (value) {
                    if (value.length) {
                        return true;
                    } else {
                        return 'Please enter application components.';
                    }
                }
            }
        ];
        return inquirer.prompt(questions);
    }

};