# PHP CS Fixer for Visual Studio Code

This extension simply provides [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) command.

## Installation

Open command palette <kbd>F1</kbd> and select `Extensions: Install Extension`, then search for PHP CS Fixer.

## Usage

<kbd>F1</kbd> -> `php-cs-fixer: fix this file`

or keyboard shortcut `alt+shift+f` vs code default formatter shortcut

or right mouse context menu `Format Document`

or right mouse context menu `Format Selection`

or right mouse context menu on explorer `php-cs-fixer: fix`

## Install php-cs-fixer

1. this extension has included `php-cs-fixer.phar` for beginner, maybe performance lower.

2. if you want to install php-cs-fixer by yourself, see: [php-cs-fixer Installation guide](https://github.com/FriendsOfPHP/PHP-CS-Fixer#installation)

## Configuration

```JSON
{
    "php-cs-fixer.executablePath": "php-cs-fixer",
    "php-cs-fixer.executablePathWindows": "",   //eg: php-cs-fixer.bat
    "php-cs-fixer.onsave": false,
    "php-cs-fixer.rules": "@PSR2",
    "php-cs-fixer.config": ".php_cs;.php_cs.dist",
    "php-cs-fixer.allowRisky": false,
    "php-cs-fixer.pathMode": "override",
    "php-cs-fixer.exclude": [],
    "php-cs-fixer.autoFixByBracket": true,
    "php-cs-fixer.autoFixBySemicolon": false,
    "php-cs-fixer.formatHtml": false,
    "php-cs-fixer.documentFormattingProvider": true
}
```

install php-cs-fixer by composer

```JSON
    "php-cs-fixer.executablePath": "php-cs-fixer"
```

**TIP:** try "php-cs-fixer.bat" on **Windows**.

or use phar file

```JSON
    "php-cs-fixer.executablePath: "/full/path/of/php-cs-fixer.phar"
```

You also have `executablePathWindows` available if you want to specify Windows specific path. Useful if you share your workspace settings among different environments.

executablePath can use ${workspaceRoot} as workspace first root folder path.

[executablePath, executablePathWindows, config] can use "~/" as user home directory on os.


Additionally you can configure this extension to execute on save.

```JSON
    "php-cs-fixer.onsave": true
```

you can format html at the same time.

```JSON
    "php-cs-fixer.formatHtml": true
```

You can use a config file form a list of semicolon separated values

```JSON
    "php-cs-fixer.config": ".php_cs;.php_cs.dist"
```

config file can place in workspace root folder or .vscode folder or any other folders:

```JSON
    "php-cs-fixer.config": "/full/config/file/path"
```

Relative paths are only considered when a workspace folder is open.

config file .php_cs example

```php
<?php

return PhpCsFixer\Config::create()
    ->setRules(array(
        '@PSR2' => true,
        'array_indentation' => true,
        'array_syntax' => array('syntax' => 'short'),
        'combine_consecutive_unsets' => true,
        'method_separation' => true,
        'no_multiline_whitespace_before_semicolons' => true,
        'single_quote' => true,

        'binary_operator_spaces' => array(
            'align_double_arrow' => false,
            'align_equals' => false,
        ),
        // 'blank_line_after_opening_tag' => true,
        // 'blank_line_before_return' => true,
        'braces' => array(
            'allow_single_line_closure' => true,
        ),
        // 'cast_spaces' => true,
        // 'class_definition' => array('singleLine' => true),
        'concat_space' => array('spacing' => 'one'),
        'declare_equal_normalize' => true,
        'function_typehint_space' => true,
        'hash_to_slash_comment' => true,
        'include' => true,
        'lowercase_cast' => true,
        // 'native_function_casing' => true,
        // 'new_with_braces' => true,
        // 'no_blank_lines_after_class_opening' => true,
        // 'no_blank_lines_after_phpdoc' => true,
        // 'no_empty_comment' => true,
        // 'no_empty_phpdoc' => true,
        // 'no_empty_statement' => true,
        'no_extra_consecutive_blank_lines' => array(
            'curly_brace_block',
            'extra',
            'parenthesis_brace_block',
            'square_brace_block',
            'throw',
            'use',
        ),
        // 'no_leading_import_slash' => true,
        // 'no_leading_namespace_whitespace' => true,
        // 'no_mixed_echo_print' => array('use' => 'echo'),
        'no_multiline_whitespace_around_double_arrow' => true,
        // 'no_short_bool_cast' => true,
        // 'no_singleline_whitespace_before_semicolons' => true,
        'no_spaces_around_offset' => true,
        // 'no_trailing_comma_in_list_call' => true,
        // 'no_trailing_comma_in_singleline_array' => true,
        // 'no_unneeded_control_parentheses' => true,
        // 'no_unused_imports' => true,
        'no_whitespace_before_comma_in_array' => true,
        'no_whitespace_in_blank_line' => true,
        // 'normalize_index_brace' => true,
        'object_operator_without_whitespace' => true,
        // 'php_unit_fqcn_annotation' => true,
        // 'phpdoc_align' => true,
        // 'phpdoc_annotation_without_dot' => true,
        // 'phpdoc_indent' => true,
        // 'phpdoc_inline_tag' => true,
        // 'phpdoc_no_access' => true,
        // 'phpdoc_no_alias_tag' => true,
        // 'phpdoc_no_empty_return' => true,
        // 'phpdoc_no_package' => true,
        // 'phpdoc_no_useless_inheritdoc' => true,
        // 'phpdoc_return_self_reference' => true,
        // 'phpdoc_scalar' => true,
        // 'phpdoc_separation' => true,
        // 'phpdoc_single_line_var_spacing' => true,
        // 'phpdoc_summary' => true,
        // 'phpdoc_to_comment' => true,
        // 'phpdoc_trim' => true,
        // 'phpdoc_types' => true,
        // 'phpdoc_var_without_name' => true,
        // 'pre_increment' => true,
        // 'return_type_declaration' => true,
        // 'self_accessor' => true,
        // 'short_scalar_cast' => true,
        'single_blank_line_before_namespace' => true,
        // 'single_class_element_per_statement' => true,
        // 'space_after_semicolon' => true,
        // 'standardize_not_equals' => true,
        'ternary_operator_spaces' => true,
        // 'trailing_comma_in_multiline_array' => true,
        'trim_array_spaces' => true,
        'unary_operator_spaces' => true,
        'whitespace_after_comma_in_array' => true,
    ))
    //->setIndent("\t")
    ->setLineEnding("\n")
;
```

## Auto fix

    1. by Bracket, when press down the key } auto fix the code in the brackets {}
    2. by Semicolon, when press down the key ; auto fix the code at the current line

For more information please visit: [https://github.com/FriendsOfPHP/PHP-CS-Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer)

## License

MIT
