<?php
declare(strict_types = 1);

namespace LanguageServer\Server;

use LanguageServer\{
    CompletionProvider, SignatureHelpProvider, LanguageClient, PhpDocument, PhpDocumentLoader, DefinitionResolver
};
use LanguageServer\Index\ReadableIndex;
use LanguageServer\Factory\LocationFactory;
use LanguageServer\Factory\RangeFactory;
use LanguageServerProtocol\{
    FormattingOptions,
    Hover,
    Location,
    MarkedString,
    Position,
    Range,
    ReferenceContext,
    SymbolDescriptor,
    PackageDescriptor,
    SymbolLocationInformation,
    TextDocumentIdentifier,
    TextDocumentItem,
    VersionedTextDocumentIdentifier,
    CompletionContext
};
use Microsoft\PhpParser\Node;
use Sabre\Event\Promise;
use Sabre\Uri;
use function LanguageServer\{
    isVendored, waitForEvent, getPackageName
};
use function Sabre\Event\coroutine;

/**
 * Provides method handlers for all textDocument/* methods
 */
class TextDocument
{
    /**
     * The lanugage client object to call methods on the client
     *
     * @var \LanguageServer\LanguageClient
     */
    protected $client;

    /**
     * @var Project
     */
    protected $project;

    /**
     * @var DefinitionResolver
     */
    protected $definitionResolver;

    /**
     * @var CompletionProvider
     */
    protected $completionProvider;

    /**
     * @var SignatureHelpProvider
     */
    protected $signatureHelpProvider;

    /**
     * @var ReadableIndex
     */
    protected $index;

    /**
     * @var \stdClass|null
     */
    protected $composerJson;

    /**
     * @var \stdClass|null
     */
    protected $composerLock;

    /**
     * @param PhpDocumentLoader $documentLoader
     * @param DefinitionResolver $definitionResolver
     * @param LanguageClient $client
     * @param ReadableIndex $index
     * @param \stdClass $composerJson
     * @param \stdClass $composerLock
     */
    public function __construct(
        PhpDocumentLoader $documentLoader,
        DefinitionResolver $definitionResolver,
        LanguageClient $client,
        ReadableIndex $index,
        \stdClass $composerJson = null,
        \stdClass $composerLock = null
    ) {
        $this->documentLoader = $documentLoader;
        $this->client = $client;
        $this->definitionResolver = $definitionResolver;
        $this->completionProvider = new CompletionProvider($this->definitionResolver, $index);
        $this->signatureHelpProvider = new SignatureHelpProvider($this->definitionResolver, $index, $documentLoader);
        $this->index = $index;
        $this->composerJson = $composerJson;
        $this->composerLock = $composerLock;
    }

    /**
     * The document symbol request is sent from the client to the server to list all symbols found in a given text
     * document.
     *
     * @param \LanguageServerProtocol\TextDocumentIdentifier $textDocument
     * @return Promise <SymbolInformation[]>
     */
    public function documentSymbol(TextDocumentIdentifier $textDocument): Promise
    {
        return $this->documentLoader->getOrLoad($textDocument->uri)->then(function (PhpDocument $document) {
            $symbols = [];
            foreach ($document->getDefinitions() as $fqn => $definition) {
                $symbols[] = $definition->symbolInformation;
            }
            return $symbols;
        });
    }

    /**
     * The document open notification is sent from the client to the server to signal newly opened text documents. The
     * document's truth is now managed by the client and the server must not try to read the document's truth using the
     * document's uri.
     *
     * @param \LanguageServerProtocol\TextDocumentItem $textDocument The document that was opened.
     * @return void
     */
    public function didOpen(TextDocumentItem $textDocument)
    {
        $document = $this->documentLoader->open($textDocument->uri, $textDocument->text);
        if (!isVendored($document, $this->composerJson)) {
            $this->client->textDocument->publishDiagnostics($textDocument->uri, $document->getDiagnostics());
        }
    }

    /**
     * The document change notification is sent from the client to the server to signal changes to a text document.
     *
     * @param \LanguageServerProtocol\VersionedTextDocumentIdentifier $textDocument
     * @param \LanguageServerProtocol\TextDocumentContentChangeEvent[] $contentChanges
     * @return void
     */
    public function didChange(VersionedTextDocumentIdentifier $textDocument, array $contentChanges)
    {
        $document = $this->documentLoader->get($textDocument->uri);
        $document->updateContent($contentChanges[0]->text);
        $this->client->textDocument->publishDiagnostics($textDocument->uri, $document->getDiagnostics());
    }

    /**
     * The document close notification is sent from the client to the server when the document got closed in the client.
     * The document's truth now exists where the document's uri points to (e.g. if the document's uri is a file uri the
     * truth now exists on disk).
     *
     * @param \LanguageServerProtocol\TextDocumentIdentifier $textDocument The document that was closed
     * @return void
     */
    public function didClose(TextDocumentIdentifier $textDocument)
    {
        $this->documentLoader->close($textDocument->uri);
    }

    /**
     * The references request is sent from the client to the server to resolve project-wide references for the symbol
     * denoted by the given text document position.
     *
     * @param ReferenceContext $context
     * @return Promise <Location[]>
     */
    public function references(
        ReferenceContext $context,
        TextDocumentIdentifier $textDocument,
        Position $position
    ): Promise {
        return coroutine(function () use ($textDocument, $position) {
            $document = yield $this->documentLoader->getOrLoad($textDocument->uri);
            $node = $document->getNodeAtPosition($position);
            if ($node === null) {
                return [];
            }
            $locations = [];
            // Variables always stay in the boundary of the file and need to be searched inside their function scope
            // by traversing the AST
            if (

            ($node instanceof Node\Expression\Variable && !($node->getParent()->getParent() instanceof Node\PropertyDeclaration))
                || $node instanceof Node\Parameter
                || $node instanceof Node\UseVariableName
            ) {
                if (isset($node->name) && $node->name instanceof Node\Expression) {
                    return null;
                }
                // Find function/method/closure scope
                $n = $node;

                $n = $n->getFirstAncestor(Node\Statement\FunctionDeclaration::class, Node\MethodDeclaration::class, Node\Expression\AnonymousFunctionCreationExpression::class, Node\SourceFileNode::class);

                if ($n === null) {
                    $n = $node->getFirstAncestor(Node\Statement\ExpressionStatement::class)->getParent();
                }

                foreach ($n->getDescendantNodes() as $descendantNode) {
                    if ($descendantNode instanceof Node\Expression\Variable &&
                        $descendantNode->getName() === $node->getName()
                    ) {
                        $locations[] = LocationFactory::fromNode($descendantNode);
                    }
                }
            } else {
                // Definition with a global FQN
                $fqn = DefinitionResolver::getDefinedFqn($node);

                // Wait until indexing finished
                if (!$this->index->isComplete()) {
                    yield waitForEvent($this->index, 'complete');
                }
                if ($fqn === null) {
                    $fqn = $this->definitionResolver->resolveReferenceNodeToFqn($node);
                    if ($fqn === null) {
                        return [];
                    }
                }
                $refDocumentPromises = [];
                foreach ($this->index->getReferenceUris($fqn) as $uri) {
                    $refDocumentPromises[] = $this->documentLoader->getOrLoad($uri);
                }
                $refDocuments = yield Promise\all($refDocumentPromises);
                foreach ($refDocuments as $document) {
                    $refs = $document->getReferenceNodesByFqn($fqn);
                    if ($refs !== null) {
                        foreach ($refs as $ref) {
                            $locations[] = LocationFactory::fromNode($ref);
                        }
                    }
                }
            }
            return $locations;
        });
    }

    /**
     * The signature help request is sent from the client to the server to request signature information at a given
     * cursor position.
     *
     * @param TextDocumentIdentifier $textDocument The text document
     * @param Position               $position     The position inside the text document
     *
     * @return Promise <SignatureHelp>
     */
    public function signatureHelp(TextDocumentIdentifier $textDocument, Position $position): Promise
    {
        return coroutine(function () use ($textDocument, $position) {
            $document = yield $this->documentLoader->getOrLoad($textDocument->uri);
            return $this->signatureHelpProvider->getSignatureHelp($document, $position);
        });
    }

    /**
     * The goto definition request is sent from the client to the server to resolve the definition location of a symbol
     * at a given text document position.
     *
     * @param TextDocumentIdentifier $textDocument The text document
     * @param Position $position The position inside the text document
     * @return Promise <Location|Location[]>
     */
    public function definition(TextDocumentIdentifier $textDocument, Position $position): Promise
    {
        return coroutine(function () use ($textDocument, $position) {
            $document = yield $this->documentLoader->getOrLoad($textDocument->uri);
            $node = $document->getNodeAtPosition($position);
            if ($node === null) {
                return [];
            }
            // Handle definition nodes
            $fqn = DefinitionResolver::getDefinedFqn($node);
            while (true) {
                if ($fqn) {
                    $def = $this->index->getDefinition($fqn);
                } else {
                    // Handle reference nodes
                    $def = $this->definitionResolver->resolveReferenceNodeToDefinition($node);
                }
                // If no result was found and we are still indexing, try again after the index was updated
                if ($def !== null || $this->index->isComplete()) {
                    break;
                }
                yield waitForEvent($this->index, 'definition-added');
            }
            if (
                $def === null
                || $def->symbolInformation === null
                || Uri\parse($def->symbolInformation->location->uri)['scheme'] === 'phpstubs'
            ) {
                return [];
            }
            return $def->symbolInformation->location;
        });
    }

    /**
     * The hover request is sent from the client to the server to request hover information at a given text document position.
     *
     * @param TextDocumentIdentifier $textDocument The text document
     * @param Position $position The position inside the text document
     * @return Promise <Hover>
     */
    public function hover(TextDocumentIdentifier $textDocument, Position $position): Promise
    {
        return coroutine(function () use ($textDocument, $position) {
            $document = yield $this->documentLoader->getOrLoad($textDocument->uri);
            // Find the node under the cursor
            $node = $document->getNodeAtPosition($position);
            if ($node === null) {
                return new Hover([]);
            }
            $definedFqn = DefinitionResolver::getDefinedFqn($node);
            while (true) {
                if ($definedFqn) {
                    // Support hover for definitions
                    $def = $this->index->getDefinition($definedFqn);
                } else {
                    // Get the definition for whatever node is under the cursor
                    $def = $this->definitionResolver->resolveReferenceNodeToDefinition($node);
                }
                // If no result was found and we are still indexing, try again after the index was updated
                if ($def !== null || $this->index->isComplete()) {
                    break;
                }
                yield waitForEvent($this->index, 'definition-added');
            }
            $range = RangeFactory::fromNode($node);
            if ($def === null) {
                return new Hover([], $range);
            }
            $contents = [];
            if ($def->declarationLine) {
                $contents[] = new MarkedString('php', "<?php\n" . $def->declarationLine);
            }
            if ($def->documentation) {
                $contents[] = $def->documentation;
            }
            return new Hover($contents, $range);
        });
    }

    /**
     * The Completion request is sent from the client to the server to compute completion items at a given cursor
     * position. Completion items are presented in the IntelliSense user interface. If computing full completion items
     * is expensive, servers can additionally provide a handler for the completion item resolve request
     * ('completionItem/resolve'). This request is sent when a completion item is selected in the user interface. A
     * typically use case is for example: the 'textDocument/completion' request doesn't fill in the documentation
     * property for returned completion items since it is expensive to compute. When the item is selected in the user
     * interface then a 'completionItem/resolve' request is sent with the selected completion item as a param. The
     * returned completion item should have the documentation property filled in.
     *
     * @param TextDocumentIdentifier The text document
     * @param Position $position The position
     * @param CompletionContext|null $context The completion context
     * @return Promise <CompletionItem[]|CompletionList>
     */
    public function completion(TextDocumentIdentifier $textDocument, Position $position, CompletionContext $context = null): Promise
    {
        return coroutine(function () use ($textDocument, $position, $context) {
            $document = yield $this->documentLoader->getOrLoad($textDocument->uri);
            return $this->completionProvider->provideCompletion($document, $position, $context);
        });
    }

    /**
     * This method is the same as textDocument/definition, except that
     *
     * The method returns metadata about the definition (the same metadata that workspace/xreferences searches for).
     * The concrete location to the definition (location field) is optional. This is useful because the language server
     * might not be able to resolve a goto definition request to a concrete location (e.g. due to lack of dependencies)
     * but still may know some information about it.
     *
     * @param TextDocumentIdentifier $textDocument The text document
     * @param Position               $position     The position inside the text document
     * @return Promise <SymbolLocationInformation[]>
     */
    public function xdefinition(TextDocumentIdentifier $textDocument, Position $position): Promise
    {
        return coroutine(function () use ($textDocument, $position) {
            $document = yield $this->documentLoader->getOrLoad($textDocument->uri);
            $node = $document->getNodeAtPosition($position);
            if ($node === null) {
                return [];
            }
            // Handle definition nodes
            $fqn = DefinitionResolver::getDefinedFqn($node);
            while (true) {
                if ($fqn) {
                    $def = $this->index->getDefinition($fqn);
                } else {
                    // Handle reference nodes
                    $def = $this->definitionResolver->resolveReferenceNodeToDefinition($node);
                }
                // If no result was found and we are still indexing, try again after the index was updated
                if ($def !== null || $this->index->isComplete()) {
                    break;
                }
                yield waitForEvent($this->index, 'definition-added');
            }
            if (
                $def === null
                || $def->symbolInformation === null
                || Uri\parse($def->symbolInformation->location->uri)['scheme'] === 'phpstubs'
            ) {
                return [];
            }
            // if Definition is inside a dependency, use the package name
            $packageName = getPackageName($def->symbolInformation->location->uri, $this->composerJson);
            // else use the package name of the root package (if exists)
            if (!$packageName && $this->composerJson !== null) {
                $packageName = $this->composerJson->name;
            }
            $descriptor = new SymbolDescriptor($def->fqn, new PackageDescriptor($packageName));
            return [new SymbolLocationInformation($descriptor, $def->symbolInformation->location)];
        });
    }
}
