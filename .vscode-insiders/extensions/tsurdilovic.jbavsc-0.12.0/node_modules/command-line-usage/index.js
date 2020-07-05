'use strict'
/**
 * @module command-line-usage
 */
module.exports = commandLineUsage

/**
 * Generates a usage guide suitable for a command-line app.
 * @param {Section|Section[]} - One of more section objects ({@link module:command-line-usage~content} or {@link module:command-line-usage~optionList}).
 * @returns {string}
 * @alias module:command-line-usage
 */
function commandLineUsage (sections) {
  const arrayify = require('array-back')
  sections = arrayify(sections)
  if (sections.length) {
    const OptionList = require('./lib/option-list')
    const ContentSection = require('./lib/content-section')
    const output = sections.map(section => {
      if (section.optionList) {
        return new OptionList(section)
      } else {
        return new ContentSection(section)
      }
    })
    return '\n' + output.join('\n')
  }
}

/**
 * A Content section comprises a header and one or more lines of content.
 * @typedef module:command-line-usage~content
 * @property header {string} - The section header, always bold and underlined.
 * @property content {string|string[]|object[]} - Overloaded property, accepting data in one of four formats:
 *
 * 1. A single string (one line of text)
 * 2. An array of strings (multiple lines of text)
 * 3. An array of objects (recordset-style data). In this case, the data will be rendered in table format. The property names of each object are not important, so long as they are consistent throughout the array.
 * 4. An object with two properties - `data` and `options`. In this case, the data and options will be passed directly to the underlying [table layout](https://github.com/75lb/table-layout) module for rendering.
 *
 * @property raw {boolean} - Set to true to avoid indentation and wrapping. Useful for banners.
 * @example
 * Simple string of content. For ansi formatting, use [chalk template literal syntax](https://github.com/chalk/chalk#tagged-template-literal).
 * ```js
 * {
 *   header: 'A typical app',
 *   content: 'Generates something {rgb(255,200,0).italic very {underline.bgRed important}}.'
 * }
 * ```
 *
 * An array of strings is interpreted as lines, to be joined by the system newline character.
 * ```js
 * {
 *   header: 'A typical app',
 *   content: [
 *     'First line.',
 *     'Second line.'
 *   ]
 * }
 * ```
 *
 * An array of recordset-style objects are rendered in table layout.
 * ```js
 * {
 *   header: 'A typical app',
 *   content: [
 *     { colA: 'First row, first column.', colB: 'First row, second column.'},
 *     { colA: 'Second row, first column.', colB: 'Second row, second column.'}
 *   ]
 * }
 * ```
 *
 * An object with `data` and `options` properties will be passed directly to the underlying [table layout](https://github.com/75lb/table-layout) module for rendering.
 * ```js
 * {
 *   header: 'A typical app',
 *   content: {
 *     data: [
 *      { colA: 'First row, first column.', colB: 'First row, second column.'},
 *      { colA: 'Second row, first column.', colB: 'Second row, second column.'}
 *     ],
 *     options: {
 *       maxWidth: 60
 *     }
 *   }
 * }
 * ```
 */

 /**
  * A OptionList section adds a table displaying details of the available options.
  * @typedef module:command-line-usage~optionList
  * @property {string} [header] - The section header, always bold and underlined.
  * @property optionList {OptionDefinition[]} - an array of [option definition](https://github.com/75lb/command-line-args/blob/master/doc/option-definition.md) objects. In addition to the regular definition properties, command-line-usage will look for:
  *
  * - `description` - a string describing the option.
  * - `typeLabel` - a string to replace the default type string (e.g. `<string>`). It's often more useful to set a more descriptive type label, like `<ms>`, `<files>`, `<command>` etc.
  * @property {string|string[]} [group] - If specified, only options from this particular group will be printed. [Example](https://github.com/75lb/command-line-usage/blob/master/example/groups.js).
  * @property {string|string[]} [hide] - The names of one of more option definitions to hide from the option list. [Example](https://github.com/75lb/command-line-usage/blob/master/example/hide.js).
  * @property {boolean} [reverseNameOrder] - If true, the option alias will be displayed after the name, i.e. `--verbose, -v` instead of `-v, --verbose`).
  * @property {object} [tableOptions] - An options object suitable for passing into [table-layout](https://github.com/75lb/table-layout#table-). See [here for an example](https://github.com/75lb/command-line-usage/blob/master/example/option-list-options.js).
  *
  * @example
  * {
  *   header: 'Options',
  *   optionList: [
  *     {
  *       name: 'help', alias: 'h', description: 'Display this usage guide.'
  *     },
  *     {
  *       name: 'src', description: 'The input files to process',
  *       multiple: true, defaultOption: true, typeLabel: '{underline file} ...'
  *     },
  *     {
  *       name: 'timeout', description: 'Timeout value in ms. This description is needlessly long unless you count testing of the description column maxWidth useful.',
  *       alias: 't', typeLabel: '{underline ms}'
  *     }
  *   ]
  * }
  */
