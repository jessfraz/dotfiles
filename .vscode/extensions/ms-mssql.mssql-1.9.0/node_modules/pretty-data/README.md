# pretty-data - Nodejs plugin

nodejs plugin to **pretty-print** or **minify**
text in **XML**, **JSON**, **CSS**  and  **SQL** formats.

**Version** - 0.40.0

**Copyright** (c) 2012 Vadim Kiryukhin ( vkiryukhin @ gmail.com )

**Home page:** [http://www.eslinstructor.net/pretty-data/](http://www.eslinstructor.net/pretty-data/) 

**License:** Dual licensed under
the MIT and GPL licenses:

[http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)

[http://www.gnu.org/licenses/gpl.html](http://www.gnu.org/licenses/gpl.html)

##Description

* `pd.xml(data )` - pretty print XML; 

* `pd.json(data)` - pretty print JSON; 

* `pd.css(data )` - pretty print CSS; 

* `pd.sql(data )` - pretty print SQL; 

* `pd.xmlmin(data [, preserveComments]) ` - minify XML; 

* `pd.jsonmin(data)` - minify JSON text;

* `pd.cssmin(data [, preserveComments] )` - minify CSS text; 

* `pd.sqlmin(data)` - minify JSON text;

**PARAMETERS:**

`@data` - String; XML, JSON, CSS or SQL text to beautify; 

`@preserveComments` - Bool (optional, used in npp.minxml and npp.mincss only); 
                       Set this flag to true to prevent removing comments from @data; 

`@Return` - String;


**USAGE:**

`var pd = require('pretty-data').pd; `

`var xml_pp = pd.xml(data); `

`var xml_min = pd.xmlmin(data [,true]);` 

`var json_pp = pd.json(data);` 

`var json_min = pd.jsonmin(data);` 

`var css_pp = pd.css(data); `

`var css_min = pd.cssmin(data [, true]);`

`var sql_pp = pd.sql(data);` 

`var sql_min = pd.sqlmin(data);` 

**TEST:**

`node ./test/test_xml 

`node ./test/test_json

`node ./test/test_css

`node ./test/test_sql 



