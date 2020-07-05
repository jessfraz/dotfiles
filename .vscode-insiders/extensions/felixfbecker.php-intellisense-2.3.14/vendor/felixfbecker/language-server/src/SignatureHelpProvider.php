<?php
declare(strict_types = 1);

namespace LanguageServer;

use LanguageServer\Index\ReadableIndex;
use LanguageServerProtocol\{
    Position,
    SignatureHelp
};
use Microsoft\PhpParser\Node;
use Sabre\Event\Promise;
use function Sabre\Event\coroutine;

class SignatureHelpProvider
{
    /** @var DefinitionResolver */
    private $definitionResolver;

    /** @var ReadableIndex */
    private $index;

    /** @var PhpDocumentLoader */
    private $documentLoader;

    /**
     * Constructor
     *
     * @param DefinitionResolver $definitionResolver
     * @param ReadableIndex      $index
     * @param PhpDocumentLoader  $documentLoader
     */
    public function __construct(DefinitionResolver $definitionResolver, ReadableIndex $index, PhpDocumentLoader $documentLoader)
    {
        $this->definitionResolver = $definitionResolver;
        $this->index = $index;
        $this->documentLoader = $documentLoader;
    }

    /**
     * Finds signature help for a callable position
     *
     * @param PhpDocument $doc      The document the position belongs to
     * @param Position    $position The position to detect a call from
     *
     * @return Promise <SignatureHelp>
     */
    public function getSignatureHelp(PhpDocument $doc, Position $position): Promise
    {
        return coroutine(function () use ($doc, $position) {
            // Find the node under the cursor
            $node = $doc->getNodeAtPosition($position);

            // Find the definition of the item being called
            list($def, $argumentExpressionList) = yield $this->getCallingInfo($node);

            if (!$def || !$def->signatureInformation) {
                return new SignatureHelp();
            }

            // Find the active parameter
            $activeParam = $argumentExpressionList
                ? $this->findActiveParameter($argumentExpressionList, $position, $doc)
                : 0;

            return new SignatureHelp([$def->signatureInformation], 0, $activeParam);
        });
    }

    /**
     * Given a node that could be a callable, finds the definition of the call and the argument expression list of
     * the node
     *
     * @param Node $node The node to find calling information from
     *
     * @return Promise <array|null>
     */
    private function getCallingInfo(Node $node)
    {
        return coroutine(function () use ($node) {
            $fqn = null;
            $callingNode = null;
            if ($node instanceof Node\DelimitedList\ArgumentExpressionList) {
                // Cursor is already inside a (
                $argumentExpressionList = $node;
                if ($node->parent instanceof Node\Expression\ObjectCreationExpression) {
                    // Constructing something
                    $callingNode = $node->parent->classTypeDesignator;
                    if (!$callingNode instanceof Node\QualifiedName) {
                        // We only support constructing from a QualifiedName
                        return null;
                    }
                    $fqn = $this->definitionResolver->resolveReferenceNodeToFqn($callingNode);
                    $fqn = "{$fqn}->__construct()";
                } else {
                    $callingNode = $node->parent->getFirstChildNode(
                        Node\Expression\MemberAccessExpression::class,
                        Node\Expression\ScopedPropertyAccessExpression::class,
                        Node\QualifiedName::class
                    );
                }
            } elseif ($node instanceof Node\Expression\CallExpression) {
                $argumentExpressionList = $node->getFirstChildNode(Node\DelimitedList\ArgumentExpressionList::class);
                $callingNode = $node->getFirstChildNode(
                    Node\Expression\MemberAccessExpression::class,
                    Node\Expression\ScopedPropertyAccessExpression::class,
                    Node\QualifiedName::class
                );
            } elseif ($node instanceof Node\Expression\ObjectCreationExpression) {
                $argumentExpressionList = $node->getFirstChildNode(Node\DelimitedList\ArgumentExpressionList::class);
                $callingNode = $node->classTypeDesignator;
                if (!$callingNode instanceof Node\QualifiedName) {
                    // We only support constructing from a QualifiedName
                    return null;
                }
                // Manually build the __construct fqn
                $fqn = $this->definitionResolver->resolveReferenceNodeToFqn($callingNode);
                $fqn = "{$fqn}->__construct()";
            }

            if (!$callingNode) {
                return null;
            }

            // Now find the definition of the call
            $fqn = $fqn ?: DefinitionResolver::getDefinedFqn($callingNode);
            while (true) {
                if ($fqn) {
                    $def = $this->index->getDefinition($fqn);
                } else {
                    $def = $this->definitionResolver->resolveReferenceNodeToDefinition($callingNode);
                }
                if ($def !== null || $this->index->isComplete()) {
                    break;
                }
                yield waitForEvent($this->index, 'definition-added');
            }

            if (!$def) {
                return null;
            }

            return [$def, $argumentExpressionList];
        });
    }

    /**
     * Given a position and arguments, finds the "active" argument at the position
     *
     * @param Node\DelimitedList\ArgumentExpressionList $argumentExpressionList The argument expression list
     * @param Position                                  $position               The position to detect the active argument from
     * @param PhpDocument                               $doc                    The document that contains the expression
     *
     * @return int
     */
    private function findActiveParameter(
        Node\DelimitedList\ArgumentExpressionList $argumentExpressionList,
        Position $position,
        PhpDocument $doc
    ): int {
        $args = $argumentExpressionList->children;
        $i = 0;
        $found = null;
        foreach ($args as $arg) {
            if ($arg instanceof Node) {
                $start = $arg->getFullStart();
                $end = $arg->getEndPosition();
            } else {
                $start = $arg->fullStart;
                $end = $start + $arg->length;
            }
            $offset = $position->toOffset($doc->getContent());
            if ($offset >= $start && $offset <= $end) {
                $found = $i;
                break;
            }
            if ($arg instanceof Node) {
                ++$i;
            }
        }
        if ($found === null) {
            $found = $i;
        }
        return $found;
    }
}
