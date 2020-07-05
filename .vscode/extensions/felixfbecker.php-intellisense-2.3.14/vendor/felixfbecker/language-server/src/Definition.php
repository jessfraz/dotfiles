<?php
declare(strict_types = 1);

namespace LanguageServer;

use LanguageServer\Index\ReadableIndex;
use phpDocumentor\Reflection\{Types, Type, TypeResolver};
use LanguageServerProtocol\SymbolInformation;
use Generator;

/**
 * Class used to represent symbols
 */
class Definition
{
    /**
     * The fully qualified name of the symbol, if it has one
     *
     * Examples of FQNs:
     *  - testFunction()
     *  - TestNamespace
     *  - TestNamespace\TestClass
     *  - TestNamespace\TestClass::TEST_CONSTANT
     *  - TestNamespace\TestClass::$staticTestProperty
     *  - TestNamespace\TestClass->testProperty
     *  - TestNamespace\TestClass::staticTestMethod()
     *  - TestNamespace\TestClass->testMethod()
     *
     * @var string|null
     */
    public $fqn;

    /**
     * For class or interfaces, the FQNs of extended classes and implemented interfaces
     *
     * @var string[]
     */
    public $extends;

    /**
     * False for classes, interfaces, traits, functions and non-class constants
     * True for methods, properties and class constants
     * This is so methods and properties are not suggested in the global scope
     *
     * @var bool
     */
    public $isMember;

    /**
     * True if this definition is affected by global namespace fallback (global function or global constant)
     *
     * @var bool
     */
    public $roamed;

    /**
     * False for instance methods and properties
     *
     * @var bool
     */
    public $isStatic;

    /**
     * True if the Definition is a class
     *
     * @var bool
     */
    public $canBeInstantiated;

    /**
     * @var SymbolInformation
     */
    public $symbolInformation;

    /**
     * The type a reference to this symbol will resolve to.
     * For properties and constants, this is the type of the property/constant.
     * For functions and methods, this is the return type.
     * For any other declaration it will be null.
     * Can also be a compound type.
     * If it is unknown, will be Types\Mixed_.
     *
     * @var Type|null
     */
    public $type;

    /**
     * The first line of the declaration, for use in textDocument/hover
     *
     * @var string
     */
    public $declarationLine;

    /**
     * A documentation string, for use in textDocument/hover
     *
     * @var string
     */
    public $documentation;

    /**
     * Signature information if this definition is for a FunctionLike, for use in textDocument/signatureHelp
     *
     * @var SignatureInformation
     */
    public $signatureInformation;

    /**
     * Yields the definitons of all ancestor classes (the Definition fqn is yielded as key)
     *
     * @param ReadableIndex $index the index to search for needed definitions
     * @param bool $includeSelf should the first yielded value be the current definition itself
     * @return Generator
     */
    public function getAncestorDefinitions(ReadableIndex $index, bool $includeSelf = false): Generator
    {
        if ($includeSelf) {
            yield $this->fqn => $this;
        }
        if ($this->extends !== null) {
            // iterating once, storing the references and iterating again
            // guarantees that closest definitions are yielded first
            $definitions = [];
            foreach ($this->extends as $fqn) {
                $def = $index->getDefinition($fqn);
                if ($def !== null) {
                    yield $def->fqn => $def;
                    $definitions[] = $def;
                }
            }
            foreach ($definitions as $def) {
                yield from $def->getAncestorDefinitions($index);
            }
        }
    }
}
