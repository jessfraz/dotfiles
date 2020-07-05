[![view on npm](http://img.shields.io/npm/v/command-line-usage.svg)](https://www.npmjs.org/package/command-line-usage)
[![npm module downloads](http://img.shields.io/npm/dt/command-line-usage.svg)](https://www.npmjs.org/package/command-line-usage)
[![Build Status](https://travis-ci.org/75lb/command-line-usage.svg?branch=master)](https://travis-ci.org/75lb/command-line-usage)
[![Dependency Status](https://david-dm.org/75lb/command-line-usage.svg)](https://david-dm.org/75lb/command-line-usage)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

# command-line-usage
A simple, data-driven module for creating a usage guide.

## Synopsis
A usage guide is created by first defining an arbitrary number of sections, e.g. a description section, synopsis, option list, examples, footer etc. Each section has an optional header, some content and must be of type <code><a href="#commandlineusagecontent">content</a></code> or <code><a href="#commandlineusageoptionlist">optionList</a></code>. This section data is passed to <code><a href="#commandlineusagesections--string-">commandLineUsage()</a></code> which returns a usage guide.

Inline ansi formatting can be used anywhere within section content using [chalk template literal syntax](https://github.com/chalk/chalk#tagged-template-literal).

For example, this script:
```js
const commandLineUsage = require('command-line-usage')

const sections = [
  {
    header: 'A typical app',
    content: 'Generates something {italic very} important.'
  },
  {
    header: 'Options',
    optionList: [
      {
        name: 'input',
        typeLabel: '{underline file}',
        description: 'The input to process.'
      },
      {
        name: 'help',
        description: 'Print this usage guide.'
      }
    ]
  }
]
const usage = commandLineUsage(sections)
console.log(usage)
```

Outputs this guide:

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/synopsis.png)

## More examples

### Simple
A fairly typical usage guide with three sections - description, option list and footer. [Code](https://github.com/75lb/command-line-usage/blob/master/example/simple.js).

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/simple.png)

### Option List groups
Demonstrates breaking the option list up into groups. [Code](https://github.com/75lb/command-line-usage/blob/master/example/groups.js).

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/groups.png)

### Banners
A banner is created by adding the `raw: true` property to your `content`. This flag disables any formatting on the content, displaying it raw as supplied.

#### Header
Demonstrates a banner at the top. This example also adds a `synopsis` section. [Code](https://github.com/75lb/command-line-usage/blob/master/example/header.js).

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/header.png)

#### Footer
Demonstrates a footer banner. [Code](https://github.com/75lb/command-line-usage/blob/master/example/footer.js).

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/footer.png)

### Examples section (table layout)
An examples section is added. To achieve this table layout, supply the `content` as an array of objects. The property names of each object are not important, so long as they are consistent throughout the array. [Code](https://github.com/75lb/command-line-usage/blob/master/example/examples.js).

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/example-columns.png)

### Advanced optionList layout
The `optionList` layout is fully configurable by setting the `tableOptions` property with an options object suitable for passing into [table-layout](https://github.com/75lb/table-layout#table-). This example overrides the default column widths and adds flame padding. [Code](https://github.com/75lb/command-line-usage/blob/master/example/option-list-options.js).

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/option-list-options.png)

### Command list
Useful if your app is command-driven, like git or npm. [Code](https://github.com/75lb/command-line-usage/blob/master/example/command-list.js).

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/command-list.png)

### Description section (table layout)
Demonstrates supplying specific [table layout](https://github.com/75lb/table-layout) options to achieve more advanced layout. In this case the second column (containing the hammer and sickle) has a fixed `width` of 40 and `noWrap` enabled (as the input is already formatted as desired). [Code](https://github.com/75lb/command-line-usage/blob/master/example/description-columns.js).

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/description-columns.png)

### Whitespace
By default, whitespace from the beginning of each line is trimmed to ensure wrapped text always aligns neatly to the left edge of the column. This can be undesirable when whitespace is intentional like the indented bullet points shown in this example. The two ways to disable whitespace trimming are shown in [this example code](https://github.com/75lb/command-line-usage/blob/master/example/whitespace.js).

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/whitespace.png)

### Real-life
The [polymer-cli](https://github.com/Polymer/polymer-cli/) usage guide is a good real-life example.

![usage](https://raw.githubusercontent.com/75lb/command-line-usage/master/example/screens/polymer.png)

## API Reference


* [command-line-usage](#module_command-line-usage)
    * [commandLineUsage(sections)](#exp_module_command-line-usage--commandLineUsage) ⇒ <code>string</code> ⏏
        * [~content](#module_command-line-usage--commandLineUsage..content)
        * [~optionList](#module_command-line-usage--commandLineUsage..optionList)

<a name="exp_module_command-line-usage--commandLineUsage"></a>

### commandLineUsage(sections) ⇒ <code>string</code> ⏏
Generates a usage guide suitable for a command-line app.

**Kind**: Exported function  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>sections</td><td><code>Section</code> | <code>Array.&lt;Section&gt;</code></td><td><p>One of more section objects (<a href="#module_command-line-usage--commandLineUsage..content">content</a> or <a href="#module_command-line-usage--commandLineUsage..optionList">optionList</a>).</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_command-line-usage--commandLineUsage..content"></a>

#### commandLineUsage~content
A Content section comprises a header and one or more lines of content.

**Kind**: inner typedef of [<code>commandLineUsage</code>](#exp_module_command-line-usage--commandLineUsage)  
**Properties**

<table>
  <thead>
    <tr>
      <th>Name</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>header</td><td><code>string</code></td><td><p>The section header, always bold and underlined.</p>
</td>
    </tr><tr>
    <td>content</td><td><code>string</code> | <code>Array.&lt;string&gt;</code> | <code>Array.&lt;object&gt;</code></td><td><p>Overloaded property, accepting data in one of four formats:</p>
<ol>
<li>A single string (one line of text)</li>
<li>An array of strings (multiple lines of text)</li>
<li>An array of objects (recordset-style data). In this case, the data will be rendered in table format. The property names of each object are not important, so long as they are consistent throughout the array.</li>
<li>An object with two properties - <code>data</code> and <code>options</code>. In this case, the data and options will be passed directly to the underlying <a href="https://github.com/75lb/table-layout">table layout</a> module for rendering.</li>
</ol>
</td>
    </tr><tr>
    <td>raw</td><td><code>boolean</code></td><td><p>Set to true to avoid indentation and wrapping. Useful for banners.</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
Simple string of content. For ansi formatting, use [chalk template literal syntax](https://github.com/chalk/chalk#tagged-template-literal).
```js
{
  header: 'A typical app',
  content: 'Generates something {rgb(255,200,0).italic very {underline.bgRed important}}.'
}
```

An array of strings is interpreted as lines, to be joined by the system newline character.
```js
{
  header: 'A typical app',
  content: [
    'First line.',
    'Second line.'
  ]
}
```

An array of recordset-style objects are rendered in table layout.
```js
{
  header: 'A typical app',
  content: [
    { colA: 'First row, first column.', colB: 'First row, second column.'},
    { colA: 'Second row, first column.', colB: 'Second row, second column.'}
  ]
}
```

An object with `data` and `options` properties will be passed directly to the underlying [table layout](https://github.com/75lb/table-layout) module for rendering.
```js
{
  header: 'A typical app',
  content: {
    data: [
     { colA: 'First row, first column.', colB: 'First row, second column.'},
     { colA: 'Second row, first column.', colB: 'Second row, second column.'}
    ],
    options: {
      maxWidth: 60
    }
  }
}
```
<a name="module_command-line-usage--commandLineUsage..optionList"></a>

#### commandLineUsage~optionList
A OptionList section adds a table displaying details of the available options.

**Kind**: inner typedef of [<code>commandLineUsage</code>](#exp_module_command-line-usage--commandLineUsage)  
**Properties**

<table>
  <thead>
    <tr>
      <th>Name</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[header]</td><td><code>string</code></td><td><p>The section header, always bold and underlined.</p>
</td>
    </tr><tr>
    <td>optionList</td><td><code>Array.&lt;OptionDefinition&gt;</code></td><td><p>an array of <a href="https://github.com/75lb/command-line-args/blob/master/doc/option-definition.md">option definition</a> objects. In addition to the regular definition properties, command-line-usage will look for:</p>
<ul>
<li><code>description</code> - a string describing the option.</li>
<li><code>typeLabel</code> - a string to replace the default type string (e.g. <code>&lt;string&gt;</code>). It&#39;s often more useful to set a more descriptive type label, like <code>&lt;ms&gt;</code>, <code>&lt;files&gt;</code>, <code>&lt;command&gt;</code> etc.</li>
</ul>
</td>
    </tr><tr>
    <td>[group]</td><td><code>string</code> | <code>Array.&lt;string&gt;</code></td><td><p>If specified, only options from this particular group will be printed. <a href="https://github.com/75lb/command-line-usage/blob/master/example/groups.js">Example</a>.</p>
</td>
    </tr><tr>
    <td>[hide]</td><td><code>string</code> | <code>Array.&lt;string&gt;</code></td><td><p>The names of one of more option definitions to hide from the option list. <a href="https://github.com/75lb/command-line-usage/blob/master/example/hide.js">Example</a>.</p>
</td>
    </tr><tr>
    <td>[reverseNameOrder]</td><td><code>boolean</code></td><td><p>If true, the option alias will be displayed after the name, i.e. <code>--verbose, -v</code> instead of <code>-v, --verbose</code>).</p>
</td>
    </tr><tr>
    <td>[tableOptions]</td><td><code>object</code></td><td><p>An options object suitable for passing into <a href="https://github.com/75lb/table-layout#table-">table-layout</a>. See <a href="https://github.com/75lb/command-line-usage/blob/master/example/option-list-options.js">here for an example</a>.</p>
</td>
    </tr>  </tbody>
</table>

**Example**  
```js
{
  header: 'Options',
  optionList: [
    {
      name: 'help', alias: 'h', description: 'Display this usage guide.'
    },
    {
      name: 'src', description: 'The input files to process',
      multiple: true, defaultOption: true, typeLabel: '{underline file} ...'
    },
    {
      name: 'timeout', description: 'Timeout value in ms. This description is needlessly long unless you count testing of the description column maxWidth useful.',
      alias: 't', typeLabel: '{underline ms}'
    }
  ]
}
```

* * *

&copy; 2015-18 Lloyd Brookes \<75pound@gmail.com\>. Documented by [jsdoc-to-markdown](https://github.com/75lb/jsdoc-to-markdown).
