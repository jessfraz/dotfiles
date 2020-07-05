	
var xml = '<?xml version="1.0" encoding="UTF-8" ?>      <!DOCTYPE foo SYSTEM "Foo.dtd"><a>          <b>bbb</b>   <!-- comment --><c/><d><soapenv:Envelope xmlns:soapenv="http://xxx" xmlns:xsd="http://yyy" xmlns:xsi="http://zzz"></soapenv>       </d><e>        <![CDATA[ <z></z> ]]></e><f><g></g></f></a>',
    pp_xml  = require('../pretty-data').pd.xml(xml),
    pp_xmlmin_com  = require('../pretty-data').pd.xmlmin(xml,true),
    pp_xmlmin  = require('../pretty-data').pd.xmlmin(xml);

console.log('\n==============================================================================\n');
console.log('\n/*------- Original XML string: -------*/\n\n' + xml + '\n');
console.log('\n/*------- Beautified XML -------------*/\n\n' + pp_xml  + '\n');
console.log('\n/*------- Minified XML with preserved comments: -------*/\n\n' + pp_xmlmin_com + '\n');
console.log('\n/*------- Minified XML with deleted comments: ---------*/\n\n' + pp_xmlmin + '\n');
console.log('\n===============================================================================\n');
