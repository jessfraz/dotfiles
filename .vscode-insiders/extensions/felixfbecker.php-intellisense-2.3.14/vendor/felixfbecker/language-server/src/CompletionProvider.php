<?php
declare(strict_types = 1);

namespace LanguageServer;

use LanguageServer\Index\ReadableIndex;
use LanguageServer\Factory\CompletionItemFactory;
use LanguageServerProtocol\{
    TextEdit,
    Range,
    Position,
    CompletionList,
    CompletionItem,
    CompletionItemKind,
    CompletionContext,
    CompletionTriggerKind
};
use Microsoft\PhpParser;
use Microsoft\PhpParser\Node;
use Microsoft\PhpParser\ResolvedName;
use Generator;
use function LanguageServer\FqnUtilities\{
    nameConcat,
    nameGetFirstPart,
    nameGetParent,
    nameStartsWith,
    nameWithoutFirstPart
};

class CompletionProvider
{
    const KEYWORDS = [
        '?>',
        '__halt_compiler',
        'abstract',
        'and',
        'array',
        'as',
        'break',
        'callable',
        'case',
        'catch',
        'class',
        'clone',
        'const',
        'continue',
        'declare',
        'default',
        'die',
        'do',
        'echo',
        'else',
        'elseif',
        'empty',
        'enddeclare',
        'endfor',
        'endforeach',
        'endif',
        'endswitch',
        'endwhile',
        'eval',
        'exit',
        'extends',
        'false',
        'final',
        'finally',
        'for',
        'foreach',
        'function',
        'global',
        'goto',
        'if',
        'implements',
        'include',
        'include_once',
        'instanceof',
        'insteadof',
        'interface',
        'isset',
        'list',
        'namespace',
        'new',
        'null',
        'or',
        'print',
        'private',
        'protected',
        'public',
        'require',
        'require_once',
        'return',
        'static',
        'switch',
        'throw',
        'trait',
        'true',
        'try',
        'unset',
        'use',
        'var',
        'while',
        'xor',
        'yield',

        // List of other reserved words (http://php.net/manual/en/reserved.other-reserved-words.php)
        // (the ones which do not occur as actual keywords above.)
        'int',
        'float',
        'bool',
        'string',
        'void',
        'iterable',
        'object',

        // Pseudo keywords
        'from', // As in yield from
        'strict_types',
        'ticks', // As in declare(ticks=1)
        'encoding', // As in declare(encoding='EBCDIC')
    ];

    /**
     * @var DefinitionResolver
     */
    private $definitionResolver;

    /**
     * @var Project
     */
    private $project;

    /**
     * @var ReadableIndex
     */
    private $index;

    /**
     * @param DefinitionResolver $definitionResolver
     * @param ReadableIndex $index
     */
    public function __construct(DefinitionResolver $definitionResolver, ReadableIndex $index)
    {
        $this->definitionResolver = $definitionResolver;
        $this->index = $index;
    }

    /**
     * Returns suggestions for a specific cursor position in a document
     *
     * @param PhpDocument $doc The opened document
     * @param Position $pos The cursor position
     * @param CompletionContext $context The completion context
     * @return CompletionList
     */
    public function provideCompletion(
        PhpDocument $doc,
        Position $pos,
        CompletionContext $context = null
    ): CompletionList {
        // This can be made much more performant if the tree follows specific invariants.
        $node = $doc->getNodeAtPosition($pos);

        // Get the node at the position under the cursor
        $offset = $node === null ? -1 : $pos->toOffset($node->getFileContents());
        if (
            $node !== null
            && $offset > $node->getEndPosition()
            && $node->parent !== null
            && $node->parent->getLastChild() instanceof PhpParser\MissingToken
        ) {
            $node = $node->parent;
        }

        $list = new CompletionList;
        $list->isIncomplete = true;

        if ($node instanceof Node\Expression\Variable &&
            $node->parent instanceof Node\Expression\ObjectCreationExpression &&
            $node->name instanceof PhpParser\MissingToken
        ) {
            $node = $node->parent;
        }

        // Inspect the type of expression under the cursor

        $content = $doc->getContent();
        $offset = $pos->toOffset($content);
        if (
            $node === null
            || (
                $node instanceof Node\Statement\InlineHtml
                && (
                    $context !== null
                    // Make sure to not suggest on the > trigger character in HTML
                    && (
                        $context->triggerKind === CompletionTriggerKind::INVOKED
                        || $context->triggerCharacter === '<'
                    )
                )
            )
            || $pos == new Position(0, 0)
        ) {
            // HTML, beginning of file

            // Inside HTML and at the beginning of the file, propose <?php
            $item = new CompletionItem('<?php', CompletionItemKind::KEYWORD);
            $item->textEdit = new TextEdit(
                new Range($pos, $pos),
                stripStringOverlap($doc->getRange(new Range(new Position(0, 0), $pos)), '<?php')
            );
            $list->items[] = $item;

        } elseif (
            $node instanceof Node\Expression\Variable
            && !(
                $node->parent instanceof Node\Expression\ScopedPropertyAccessExpression
                && $node->parent->memberName === $node
            )
        ) {
            // Variables
            //
            //    $|
            //    $a|

            // Find variables, parameters and use statements in the scope
            $namePrefix = $node->getName() ?? '';
            foreach ($this->suggestVariablesAtNode($node, $namePrefix) as $var) {
                $item = new CompletionItem;
                $item->kind = CompletionItemKind::VARIABLE;
                $item->label = '$' . $var->getName();
                $item->documentation = $this->definitionResolver->getDocumentationFromNode($var);
                $item->detail = (string)$this->definitionResolver->getTypeFromNode($var);
                $item->textEdit = new TextEdit(
                    new Range($pos, $pos),
                    stripStringOverlap($doc->getRange(new Range(new Position(0, 0), $pos)), $item->label)
                );
                $list->items[] = $item;
            }

        } elseif ($node instanceof Node\Expression\MemberAccessExpression) {
            // Member access expressions
            //
            //    $a->c|
            //    $a->|

            // Multiple prefixes for all possible types
            $fqns = FqnUtilities\getFqnsFromType(
                $this->definitionResolver->resolveExpressionNodeToType($node->dereferencableExpression)
            );

            // The FQNs of the symbol and its parents (eg the implemented interfaces)
            foreach ($this->expandParentFqns($fqns) as $parentFqn) {
                // Add the object access operator to only get members of all parents
                $prefix = $parentFqn . '->';
                $prefixLen = strlen($prefix);
                // Collect fqn definitions
                foreach ($this->index->getChildDefinitionsForFqn($parentFqn) as $fqn => $def) {
                    if (substr($fqn, 0, $prefixLen) === $prefix && $def->isMember) {
                        $list->items[] = CompletionItemFactory::fromDefinition($def);
                    }
                }
            }

        } elseif (
            ($scoped = $node->parent) instanceof Node\Expression\ScopedPropertyAccessExpression ||
            ($scoped = $node) instanceof Node\Expression\ScopedPropertyAccessExpression
        ) {
            // Static class members and constants
            //
            //     A\B\C::$a|
            //     A\B\C::|
            //     A\B\C::$|
            //     A\B\C::foo|
            //
            //     TODO: $a::|

            // Resolve all possible types to FQNs
            $fqns = FqnUtilities\getFqnsFromType(
                $classType = $this->definitionResolver->resolveExpressionNodeToType($scoped->scopeResolutionQualifier)
            );

            // The FQNs of the symbol and its parents (eg the implemented interfaces)
            foreach ($this->expandParentFqns($fqns) as $parentFqn) {
                // Append :: operator to only get static members of all parents
                $prefix = strtolower($parentFqn . '::');
                $prefixLen = strlen($prefix);
                // Collect fqn definitions
                foreach ($this->index->getChildDefinitionsForFqn($parentFqn) as $fqn => $def) {
                    if (substr(strtolower($fqn), 0, $prefixLen) === $prefix && $def->isMember) {
                        $list->items[] = CompletionItemFactory::fromDefinition($def);
                    }
                }
            }

        } elseif (
            ParserHelpers\isConstantFetch($node)
            // Creation gets set in case of an instantiation (`new` expression)
            || ($creation = $node->parent) instanceof Node\Expression\ObjectCreationExpression
            || (($creation = $node) instanceof Node\Expression\ObjectCreationExpression)
        ) {
            // Class instantiations, function calls, constant fetches, class names
            //
            //    new MyCl|
            //    my_func|
            //    MY_CONS|
            //    MyCla|
            //    \MyCla|

            // The name Node under the cursor
            $nameNode = isset($creation) ? $creation->classTypeDesignator : $node;

            if ($nameNode instanceof Node\QualifiedName) {
                /** @var string The typed name. */
                $prefix = (string)PhpParser\ResolvedName::buildName($nameNode->nameParts, $nameNode->getFileContents());
            } else {
                $prefix = $nameNode->getText($node->getFileContents());
            }

            $namespaceNode = $node->getNamespaceDefinition();
            /** @var string The current namespace without a leading backslash. */
            $currentNamespace = $namespaceNode === null ? '' : $namespaceNode->name->getText();

            /** @var bool Whether the prefix is qualified (contains at least one backslash) */
            $isFullyQualified = false;

            /** @var bool Whether the prefix is qualified (contains at least one backslash) */
            $isQualified = false;

            if ($nameNode instanceof Node\QualifiedName) {
                $isFullyQualified = $nameNode->isFullyQualifiedName();
                $isQualified = $nameNode->isQualifiedName();
            }

            /** @var bool Whether we are in a new expression */
            $isCreation = isset($creation);

            /** @var array Import (use) tables */
            $importTables = $node->getImportTablesForCurrentScope();

            if ($isFullyQualified) {
                // \Prefix\Goes\Here| - Only return completions from the root namespace.
                /** @var $items \Generator|CompletionItem[] Generator yielding CompletionItems indexed by their FQN */
                $items = $this->getCompletionsForFqnPrefix($prefix, $isCreation, false);
            } else if ($isQualified) {
                // Prefix\Goes\Here|
                $items = $this->getPartiallyQualifiedCompletions(
                    $prefix,
                    $currentNamespace,
                    $importTables,
                    $isCreation
                );
            } else {
                // PrefixGoesHere|
                $items = $this->getUnqualifiedCompletions($prefix, $currentNamespace, $importTables, $isCreation);
            }

            $list->items = array_values(iterator_to_array($items));
            foreach ($list->items as $item) {
                // Remove ()
                if (is_string($item->insertText) && substr($item->insertText, strlen($item->insertText) - 2) === '()') {
                    $item->insertText = substr($item->insertText, 0, -2);
                }
            }

        }
        return $list;
    }

    private function getPartiallyQualifiedCompletions(
        string $prefix,
        string $currentNamespace,
        array $importTables,
        bool $requireCanBeInstantiated
    ): \Generator {
        // If the first part of the partially qualified name matches a namespace alias,
        // only definitions below that  alias can be completed.
        list($namespaceAliases,,) = $importTables;
        $prefixFirstPart = nameGetFirstPart($prefix);
        $foundAlias = $foundAliasFqn = null;
        foreach ($namespaceAliases as $alias => $aliasFqn) {
            if (strcasecmp($prefixFirstPart, $alias) === 0) {
                $foundAlias = $alias;
                $foundAliasFqn = (string)$aliasFqn;
                break;
            }
        }

        if ($foundAlias !== null) {
            yield from $this->getCompletionsFromAliasedNamespace(
                $prefix,
                $foundAlias,
                $foundAliasFqn,
                $requireCanBeInstantiated
            );
        } else {
            yield from $this->getCompletionsForFqnPrefix(
                nameConcat($currentNamespace, $prefix),
                $requireCanBeInstantiated,
                false
            );
        }
    }

    /**
     * Yields completions for non-qualified global names.
     *
     * Yields
     *  - Aliased classes
     *  - Completions from current namespace
     *  - Roamed completions from the global namespace (when not creating and not already in root NS)
     *  - PHP keywords (when not creating)
     *
     * @return \Generator|CompletionItem[]
     *   Yields CompletionItems
     */
    private function getUnqualifiedCompletions(
        string $prefix,
        string $currentNamespace,
        array $importTables,
        bool $requireCanBeInstantiated
    ): \Generator {
        // Aliases
        list($namespaceAliases,,) = $importTables;
        // use Foo\Bar
        yield from $this->getCompletionsForAliases(
            $prefix,
            $namespaceAliases,
            $requireCanBeInstantiated
        );

        // Completions from the current namespace
        yield from $this->getCompletionsForFqnPrefix(
            nameConcat($currentNamespace, $prefix),
            $requireCanBeInstantiated,
            false
        );

        if ($currentNamespace !== '' && $prefix === '') {
            // Get additional suggestions from the global namespace.
            // When completing e.g. for new |, suggest \DateTime
            yield from $this->getCompletionsForFqnPrefix('', $requireCanBeInstantiated, true);
        }

        if (!$requireCanBeInstantiated) {
            if ($currentNamespace !== '' && $prefix !== '') {
                // Roamed definitions (i.e. global constants and functions). The prefix is checked against '', since
                // in that case global completions have already been provided (including non-roamed definitions.)
                yield from $this->getRoamedCompletions($prefix);
            }

            // Lastly and least importantly, suggest keywords.
            yield from $this->getCompletionsForKeywords($prefix);
        }
    }

    /**
     * Gets completions for prefixes of fully qualified names in their parent namespace.
     *
     * @param string $prefix Prefix to complete for. Fully qualified.
     * @param bool $requireCanBeInstantiated If set, only return classes.
     * @param bool $insertFullyQualified If set, return completion with the leading \ inserted.
     * @return \Generator|CompletionItem[]
     *   Yields CompletionItems.
     */
    private function getCompletionsForFqnPrefix(
        string $prefix,
        bool $requireCanBeInstantiated,
        bool $insertFullyQualified
    ): \Generator {
        $namespace = nameGetParent($prefix);
        foreach ($this->index->getChildDefinitionsForFqn($namespace) as $fqn => $def) {
            if ($requireCanBeInstantiated && !$def->canBeInstantiated) {
                continue;
            }
            if (!nameStartsWith($fqn, $prefix)) {
                continue;
            }
            $completion = CompletionItemFactory::fromDefinition($def);
            if ($insertFullyQualified) {
                $completion->insertText =  '\\' . $fqn;
            }
            yield $fqn => $completion;
        }
    }

    /**
     * Gets completions for non-qualified names matching the start of an used class, function, or constant.
     *
     * @param string $prefix Non-qualified name being completed for
     * @param QualifiedName[] $aliases Array of alias FQNs indexed by the alias.
     * @return \Generator|CompletionItem[]
     *   Yields CompletionItems.
     */
    private function getCompletionsForAliases(
        string $prefix,
        array $aliases,
        bool $requireCanBeInstantiated
    ): \Generator {
        foreach ($aliases as $alias => $aliasFqn) {
            if (!nameStartsWith($alias, $prefix)) {
                continue;
            }
            $definition = $this->index->getDefinition((string)$aliasFqn);
            if ($definition) {
                if ($requireCanBeInstantiated && !$definition->canBeInstantiated) {
                    continue;
                }
                $completionItem = CompletionItemFactory::fromDefinition($definition);
                $completionItem->insertText = $alias;
                yield (string)$aliasFqn => $completionItem;
            }
        }
    }

    /**
     * Gets completions for partially qualified names, where the first part is matched by an alias.
     *
     * @return \Generator|CompletionItem[]
     *   Yields CompletionItems.
     */
    private function getCompletionsFromAliasedNamespace(
        string $prefix,
        string $alias,
        string $aliasFqn,
        bool $requireCanBeInstantiated
    ): \Generator {
        $prefixFirstPart = nameGetFirstPart($prefix);
        // Matched alias.
        $resolvedPrefix = nameConcat($aliasFqn, nameWithoutFirstPart($prefix));
        $completionItems = $this->getCompletionsForFqnPrefix(
            $resolvedPrefix,
            $requireCanBeInstantiated,
            false
        );
        // Convert FQNs in the CompletionItems so they are expressed in terms of the alias.
        foreach ($completionItems as $fqn => $completionItem) {
            /** @var string $fqn with the leading parts determined by the alias removed. Has the leading backslash. */
            $nameWithoutAliasedPart = substr($fqn, strlen($aliasFqn));
            $completionItem->insertText = $alias . $nameWithoutAliasedPart;
            yield $fqn => $completionItem;
        }
    }

    /**
     * Gets completions for globally defined functions and constants (i.e. symbols which may be used anywhere)
     *
     * @return \Generator|CompletionItem[]
     *   Yields CompletionItems.
     */
    private function getRoamedCompletions(string $prefix): \Generator
    {
        foreach ($this->index->getChildDefinitionsForFqn('') as $fqn => $def) {
            if (!$def->roamed || !nameStartsWith($fqn, $prefix)) {
                continue;
            }
            $completionItem = CompletionItemFactory::fromDefinition($def);
            // Second-guessing the user here - do not trust roaming to work. If the same symbol is
            // inserted in the current namespace, the code will stop working.
            $completionItem->insertText =  '\\' . $fqn;
            yield $fqn => $completionItem;
        }
    }

    /**
     * Completes PHP keywords.
     *
     * @return \Generator|CompletionItem[]
     *   Yields CompletionItems.
     */
    private function getCompletionsForKeywords(string $prefix): \Generator
    {
        foreach (self::KEYWORDS as $keyword) {
            if (nameStartsWith($keyword, $prefix)) {
                $item = new CompletionItem($keyword, CompletionItemKind::KEYWORD);
                $item->insertText = $keyword;
                yield $keyword => $item;
            }
        }
    }

    /**
     * Yields FQNs from an array along with the FQNs of all parent classes
     *
     * @param string[] $fqns
     * @return Generator
     */
    private function expandParentFqns(array $fqns) : Generator
    {
        foreach ($fqns as $fqn) {
            yield $fqn;
            $def = $this->index->getDefinition($fqn);
            if ($def !== null) {
                foreach ($def->getAncestorDefinitions($this->index) as $name => $def) {
                    yield $name;
                }
            }
        }
    }

    /**
     * Will walk the AST upwards until a function-like node is met
     * and at each level walk all previous siblings and their children to search for definitions
     * of that variable
     *
     * @param Node $node
     * @param string $namePrefix Prefix to filter
     * @return array <Node\Expr\Variable|Node\Param|Node\Expr\ClosureUse>
     */
    private function suggestVariablesAtNode(Node $node, string $namePrefix = ''): array
    {
        $vars = [];

        // Find variables in the node itself
        // When getting completion in the middle of a function, $node will be the function node
        // so we need to search it
        foreach ($this->findVariableDefinitionsInNode($node, $namePrefix) as $var) {
            // Only use the first definition
            if (!isset($vars[$var->name])) {
                $vars[$var->name] = $var;
            }
        }

        // Walk the AST upwards until a scope boundary is met
        $level = $node;
        while ($level && !($level instanceof PhpParser\FunctionLike)) {
            // Walk siblings before the node
            $sibling = $level;
            while ($sibling = $sibling->getPreviousSibling()) {
                // Collect all variables inside the sibling node
                foreach ($this->findVariableDefinitionsInNode($sibling, $namePrefix) as $var) {
                    $vars[$var->getName()] = $var;
                }
            }
            $level = $level->parent;
        }

        // If the traversal ended because a function was met,
        // also add its parameters and closure uses to the result list
        if ($level && $level instanceof PhpParser\FunctionLike && $level->parameters !== null) {
            foreach ($level->parameters->getValues() as $param) {
                $paramName = $param->getName();
                if (empty($namePrefix) || strpos($paramName, $namePrefix) !== false) {
                    $vars[$paramName] = $param;
                }
            }

            if ($level instanceof Node\Expression\AnonymousFunctionCreationExpression
                && $level->anonymousFunctionUseClause !== null
                && $level->anonymousFunctionUseClause->useVariableNameList !== null) {
                foreach ($level->anonymousFunctionUseClause->useVariableNameList->getValues() as $use) {
                    $useName = $use->getName();
                    if (empty($namePrefix) || strpos($useName, $namePrefix) !== false) {
                        $vars[$useName] = $use;
                    }
                }
            }
        }

        return array_values($vars);
    }

    /**
     * Searches the subnodes of a node for variable assignments
     *
     * @param Node $node
     * @param string $namePrefix Prefix to filter
     * @return Node\Expression\Variable[]
     */
    private function findVariableDefinitionsInNode(Node $node, string $namePrefix = ''): array
    {
        $vars = [];
        // If the child node is a variable assignment, save it

        $isAssignmentToVariable = function ($node) {
            return $node instanceof Node\Expression\AssignmentExpression;
        };

        if ($this->isAssignmentToVariableWithPrefix($node, $namePrefix)) {
            $vars[] = $node->leftOperand;
        } elseif ($node instanceof Node\ForeachKey || $node instanceof Node\ForeachValue) {
            foreach ($node->getDescendantNodes() as $descendantNode) {
                if ($descendantNode instanceof Node\Expression\Variable
                    && ($namePrefix === '' || strpos($descendantNode->getName(), $namePrefix) !== false)
                ) {
                    $vars[] = $descendantNode;
                }
            }
        } else {
            // Get all descendent variables, then filter to ones that start with $namePrefix.
            // Avoiding closure usage in tight loop
            foreach ($node->getDescendantNodes($isAssignmentToVariable) as $descendantNode) {
                if ($this->isAssignmentToVariableWithPrefix($descendantNode, $namePrefix)) {
                    $vars[] = $descendantNode->leftOperand;
                }
            }
        }

        return $vars;
    }

    private function isAssignmentToVariableWithPrefix(Node $node, string $namePrefix): bool
    {
        return $node instanceof Node\Expression\AssignmentExpression
            && $node->leftOperand instanceof Node\Expression\Variable
            && ($namePrefix === '' || strpos($node->leftOperand->getName(), $namePrefix) !== false);
    }
}
