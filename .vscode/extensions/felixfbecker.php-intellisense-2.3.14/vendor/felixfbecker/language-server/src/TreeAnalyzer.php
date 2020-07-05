<?php
declare(strict_types = 1);

namespace LanguageServer;

use LanguageServer\Factory\RangeFactory;
use LanguageServerProtocol\{Diagnostic, DiagnosticSeverity, Range, Position};
use phpDocumentor\Reflection\DocBlockFactory;
use Microsoft\PhpParser;
use Microsoft\PhpParser\Node;
use Microsoft\PhpParser\Token;

class TreeAnalyzer
{
    /** @var PhpParser\Parser */
    private $parser;

    /** @var DocBlockFactory */
    private $docBlockFactory;

    /** @var DefinitionResolver */
    private $definitionResolver;

    /** @var Node\SourceFileNode */
    private $sourceFileNode;

    /** @var Diagnostic[] */
    private $diagnostics;

    /** @var string */
    private $content;

    /** @var Node[] */
    private $referenceNodes;

    /** @var Definition[] */
    private $definitions;

    /** @var Node[] */
    private $definitionNodes;

    /**
     * @param PhpParser\Parser $parser
     * @param string $content
     * @param DocBlockFactory $docBlockFactory
     * @param DefinitionResolver $definitionResolver
     * @param string $uri
     */
    public function __construct(PhpParser\Parser $parser, string $content, DocBlockFactory $docBlockFactory, DefinitionResolver $definitionResolver, string $uri)
    {
        $this->parser = $parser;
        $this->docBlockFactory = $docBlockFactory;
        $this->definitionResolver = $definitionResolver;
        $this->sourceFileNode = $this->parser->parseSourceFile($content, $uri);

        // TODO - docblock errors

        $this->traverse($this->sourceFileNode);
    }

    /**
     * Collects Parser diagnostic messages for the Node/Token
     * and transforms them into LSP Format
     *
     * @param Node|Token $node
     * @return void
     */
    private function collectDiagnostics($node)
    {
        // Get errors from the parser.
        if (($error = PhpParser\DiagnosticsProvider::checkDiagnostics($node)) !== null) {
            $range = PhpParser\PositionUtilities::getRangeFromPosition($error->start, $error->length, $this->sourceFileNode->fileContents);

            switch ($error->kind) {
                case PhpParser\DiagnosticKind::Error:
                    $severity = DiagnosticSeverity::ERROR;
                    break;
                case PhpParser\DiagnosticKind::Warning:
                default:
                    $severity = DiagnosticSeverity::WARNING;
                    break;
            }

            $this->diagnostics[] = new Diagnostic(
                $error->message,
                new Range(
                    new Position($range->start->line, $range->start->character),
                    new Position($range->end->line, $range->start->character)
                ),
                null,
                $severity,
                'php'
            );
        }

        // Check for invalid usage of $this.
        if ($node instanceof Node\Expression\Variable && $node->getName() === 'this') {
            // Find the first ancestor that's a class method. Return an error
            // if there is none, or if the method is static.
            $method = $node->getFirstAncestor(Node\MethodDeclaration::class);
            if ($method && $method->isStatic()) {
                $this->diagnostics[] = new Diagnostic(
                    "\$this can not be used in static methods.",
                    RangeFactory::fromNode($node),
                    null,
                    DiagnosticSeverity::ERROR,
                    'php'
                );
            }
        }
    }

    /**
     * Recursive AST traversal to collect definitions/references and diagnostics
     *
     * @param Node|Token $currentNode The node/token to process
     */
    private function traverse($currentNode)
    {
        $this->collectDiagnostics($currentNode);

        // Only update/descend into Nodes, Tokens are leaves
        if ($currentNode instanceof Node) {
            $this->collectDefinitionsAndReferences($currentNode);

            foreach ($currentNode::CHILD_NAMES as $name) {
                $child = $currentNode->$name;

                if ($child === null) {
                    continue;
                }

                if (\is_array($child)) {
                    foreach ($child as $actualChild) {
                        if ($actualChild !== null) {
                            $this->traverse($actualChild);
                        }
                    }
                } else {
                    $this->traverse($child);
                }
            }
        }
    }

    /**
     * Collect definitions and references for the given node
     *
     * @param Node $node
     */
    private function collectDefinitionsAndReferences(Node $node)
    {
        $fqn = ($this->definitionResolver)::getDefinedFqn($node);
        // Only index definitions with an FQN (no variables)
        if ($fqn !== null) {
            $this->definitionNodes[$fqn] = $node;
            $this->definitions[$fqn] = $this->definitionResolver->createDefinitionFromNode($node, $fqn);
        } else {

            $parent = $node->parent;
            if (
                (
                    // $node->parent instanceof Node\Expression\ScopedPropertyAccessExpression ||
                    ($node instanceof Node\Expression\ScopedPropertyAccessExpression ||
                    $node instanceof Node\Expression\MemberAccessExpression)
                    && !(
                        $node->parent instanceof Node\Expression\CallExpression ||
                        $node->memberName instanceof PhpParser\Token
                    ))
                || ($parent instanceof Node\Statement\NamespaceDefinition && $parent->name !== null && $parent->name->getStart() === $node->getStart())
            ) {
                return;
            }

            $fqn = $this->definitionResolver->resolveReferenceNodeToFqn($node);
            if (!$fqn) {
                return;
            }

            if ($fqn === 'self' || $fqn === 'static') {
                // Resolve self and static keywords to the containing class
                // (This is not 100% correct for static but better than nothing)
                $classNode = $node->getFirstAncestor(Node\Statement\ClassDeclaration::class);
                if (!$classNode) {
                    return;
                }
                $fqn = (string)$classNode->getNamespacedName();
                if (!$fqn) {
                    return;
                }
            } else if ($fqn === 'parent') {
                // Resolve parent keyword to the base class FQN
                $classNode = $node->getFirstAncestor(Node\Statement\ClassDeclaration::class);
                if (!$classNode || !$classNode->classBaseClause || !$classNode->classBaseClause->baseClass) {
                    return;
                }
                $fqn = (string)$classNode->classBaseClause->baseClass->getResolvedName();
                if (!$fqn) {
                    return;
                }
            }

            $this->addReference($fqn, $node);

            if (
                $node instanceof Node\QualifiedName
                && ($node->isQualifiedName() || $node->parent instanceof Node\NamespaceUseClause)
                && !($parent instanceof Node\Statement\NamespaceDefinition && $parent->name->getStart() === $node->getStart()
                )
            ) {
                // Add references for each referenced namespace
                $ns = $fqn;
                while (($pos = strrpos($ns, '\\')) !== false) {
                    $ns = substr($ns, 0, $pos);
                    $this->addReference($ns, $node);
                }
            }

            // Namespaced constant access and function calls also need to register a reference
            // to the global version because PHP falls back to global at runtime
            // http://php.net/manual/en/language.namespaces.fallback.php
            if (ParserHelpers\isConstantFetch($node) ||
                ($parent instanceof Node\Expression\CallExpression
                    && !(
                        $node instanceof Node\Expression\ScopedPropertyAccessExpression ||
                        $node instanceof Node\Expression\MemberAccessExpression
                    ))) {
                $parts = explode('\\', $fqn);
                if (count($parts) > 1) {
                    $globalFqn = end($parts);
                    $this->addReference($globalFqn, $node);
                }
            }
        }
    }

    /**
     * @return Diagnostic[]
     */
    public function getDiagnostics(): array
    {
        return $this->diagnostics ?? [];
    }

    /**
     * @return void
     */
    private function addReference(string $fqn, Node $node)
    {
        if (!isset($this->referenceNodes[$fqn])) {
            $this->referenceNodes[$fqn] = [];
        }
        $this->referenceNodes[$fqn][] = $node;
    }

    /**
     * @return Definition[]
     */
    public function getDefinitions()
    {
        return $this->definitions ?? [];
    }

    /**
     * @return Node[]
     */
    public function getDefinitionNodes()
    {
        return $this->definitionNodes ?? [];
    }

    /**
     * @return Node[]
     */
    public function getReferenceNodes()
    {
        return $this->referenceNodes ?? [];
    }

    /**
     * @return Node\SourceFileNode
     */
    public function getSourceFileNode()
    {
        return $this->sourceFileNode;
    }
}
