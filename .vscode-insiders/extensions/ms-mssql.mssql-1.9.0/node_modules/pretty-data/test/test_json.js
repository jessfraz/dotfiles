	
var json  = '{"menu":{"id": "file","value": \n[[1,2,3],[4,5,6] ],\n"popup":{"menuitem":[{"value":    ["one","two"],\n"onclick":"CreateNewDoc()"},{"value":"Close","onclick":"CloseDoc()"}]}}}',
    json_pp  = require('../pretty-data').pd.json(json),
    json_min  = require('../pretty-data').pd.jsonmin(json);

console.log('\n==============================================================================\n');
console.log('\n/*------- Original JSON string: -------*/\n\n' + json + '\n');
console.log('\n/*------- Beautified JSON: -------------*/\n\n' + json_pp  + '\n');
console.log('\n/*------- Minified JSON: ---------------*/\n\n' + json_min + '\n');
console.log('\n===============================================================================\n');
