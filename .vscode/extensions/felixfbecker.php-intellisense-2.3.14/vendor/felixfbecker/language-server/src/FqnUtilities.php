<?php

namespace LanguageServer\FqnUtilities;

use phpDocumentor\Reflection\{Type, Types};

/**
 * Returns all possible FQNs in a type
 *
 * @param Type|null $type
 * @return string[]
 */
function getFqnsFromType($type): array
{
    $fqns = [];
    if ($type instanceof Types\Object_) {
        $fqsen = $type->getFqsen();
        if ($fqsen !== null) {
            $fqns[] = substr((string)$fqsen, 1);
        }
    }
    if ($type instanceof Types\Compound) {
        for ($i = 0; $t = $type->get($i); $i++) {
            foreach (getFqnsFromType($t) as $fqn) {
                $fqns[] = $fqn;
            }
        }
    }
    return $fqns;
}

/**
 * Returns parent of an FQN.
 *
 * getFqnParent('') === ''
 * getFqnParent('\\') === ''
 * getFqnParent('\A') === ''
 * getFqnParent('A') === ''
 * getFqnParent('\A\') === '\A' // Empty trailing name is considered a name.
 *
 * @return string
 */
function nameGetParent(string $name): string
{
    if ($name === '') { // Special-case handling for the root namespace.
        return '';
    }
    $parts = explode('\\', $name);
    array_pop($parts);
    return implode('\\', $parts);
}

/**
 * Concatenates two names.
 *
 * nameConcat('\Foo\Bar', 'Baz') === '\Foo\Bar\Baz'
 * nameConcat('\Foo\Bar\\', '\Baz') === '\Foo\Bar\Baz'
 * nameConcat('\\', 'Baz') === '\Baz'
 * nameConcat('', 'Baz') === 'Baz'
 *
 * @return string
 */
function nameConcat(string $a, string $b): string
{
    if ($a === '') {
        return $b;
    }
    $a = rtrim($a, '\\');
    $b = ltrim($b, '\\');
    return "$a\\$b";
}

/**
 * Returns the first component of $name.
 *
 * nameGetFirstPart('Foo\Bar') === 'Foo'
 * nameGetFirstPart('\Foo\Bar') === 'Foo'
 * nameGetFirstPart('') === ''
 * nameGetFirstPart('\') === ''
 */
function nameGetFirstPart(string $name): string
{
    $parts = explode('\\', $name, 3);
    if ($parts[0] === '' && count($parts) > 1) {
        return $parts[1];
    } else {
        return $parts[0];
    }
}

/**
 * Removes the first component of $name.
 *
 * nameWithoutFirstPart('Foo\Bar') === 'Bar'
 * nameWithoutFirstPart('\Foo\Bar') === 'Bar'
 * nameWithoutFirstPart('') === ''
 * nameWithoutFirstPart('\') === ''
 */
function nameWithoutFirstPart(string $name): string
{
    $parts = explode('\\', $name, 3);
    if ($parts[0] === '') {
        array_shift($parts);
    }
    array_shift($parts);
    return implode('\\', $parts);
}

/**
 * @param string $name Name to match against
 * @param string $prefix Prefix $name has to starts with
 * @return bool
 */
function nameStartsWith(string $name, string $prefix): bool
{
    return strlen($name) >= strlen($prefix)
        && strncmp($name, $prefix, strlen($prefix)) === 0;
}
