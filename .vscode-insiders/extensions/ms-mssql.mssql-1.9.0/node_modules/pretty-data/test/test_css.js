	
var css   = '.headbg{margin:0 8px;display:none; }a:link,a:focus{   color:#00c }\n /* comment */ a:active{   color:red }',
    pp_css  = require('../pretty-data').pd.css(css),
    pp_cssmin_com  = require('../pretty-data').pd.cssmin(css,true),
    pp_cssmin  = require('../pretty-data').pd.cssmin(css);

console.log('\n==============================================================================\n');
console.log('\n/*------- Original CSS string: -------*/\n\n' + css + '\n');
console.log('\n/*------- Beautified original CSS -------------*/\n\n' + pp_css  + '\n');
console.log('\n/*------- Minified original CSS with preserved comments: -------*/\n\n' + pp_cssmin_com + '\n');
console.log('\n/*------- Minified original CSS with deleted comments: ---------*/\n\n' + pp_cssmin + '\n');
console.log('\n===============================================================================\n');
