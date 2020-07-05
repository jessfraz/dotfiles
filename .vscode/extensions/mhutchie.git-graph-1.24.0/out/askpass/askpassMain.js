"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const http = require("http");
function fatal(err) {
    console.error('Missing or invalid credentials.');
    console.error(err);
    process.exit(1);
}
function main(argv) {
    if (argv.length !== 5)
        return fatal('Wrong number of arguments');
    if (!process.env['VSCODE_GIT_GRAPH_ASKPASS_HANDLE'])
        return fatal('Missing handle');
    if (!process.env['VSCODE_GIT_GRAPH_ASKPASS_PIPE'])
        return fatal('Missing pipe');
    const output = process.env['VSCODE_GIT_GRAPH_ASKPASS_PIPE'];
    const socketPath = process.env['VSCODE_GIT_GRAPH_ASKPASS_HANDLE'];
    const req = http.request({ socketPath, path: '/', method: 'POST' }, res => {
        if (res.statusCode !== 200)
            return fatal('Bad status code: ' + res.statusCode);
        let resData = '';
        res.setEncoding('utf8');
        res.on('data', (d) => resData += d);
        res.on('end', () => {
            try {
                let response = JSON.parse(resData);
                fs.writeFileSync(output, response + '\n');
            }
            catch (err) {
                return fatal('Error parsing response');
            }
            setTimeout(() => process.exit(0), 0);
        });
    });
    req.on('error', () => fatal('Error in request'));
    req.write(JSON.stringify({ request: argv[2], host: argv[4].substring(1, argv[4].length - 2) }));
    req.end();
}
main(process.argv);
//# sourceMappingURL=askpassMain.js.map