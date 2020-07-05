<?php
declare(strict_types = 1);

namespace LanguageServer;

use LanguageServer\ContentRetriever\ContentRetriever;
use LanguageServer\Index\ProjectIndex;
use phpDocumentor\Reflection\DocBlockFactory;
use Sabre\Event\Promise;
use function Sabre\Event\coroutine;
use Microsoft\PhpParser;

/**
 * Takes care of loading documents and managing "open" documents
 */
class PhpDocumentLoader
{
    /**
     * A map from URI => PhpDocument of open documents that should be kept in memory
     *
     * @var PhpDocument
     */
    private $documents = [];

    /**
     * @var ContentRetriever
     */
    public $contentRetriever;

    /**
     * @var ProjectIndex
     */
    private $projectIndex;

    /**
     * @var Parser
     */
    private $parser;

    /**
     * @var PhpParser\Parser
     */
    private $tolerantParser;

    /**
     * @var DocBlockFactory
     */
    private $docBlockFactory;

    /**
     * @var DefinitionResolver
     */
    private $definitionResolver;

    /**
     * @param ContentRetriever $contentRetriever
     * @param ProjectIndex $projectIndex
     * @param DefinitionResolver $definitionResolver
     * @internal param ProjectIndex $project
     */
    public function __construct(
        ContentRetriever $contentRetriever,
        ProjectIndex $projectIndex,
        DefinitionResolver $definitionResolver
    ) {
        $this->contentRetriever = $contentRetriever;
        $this->projectIndex = $projectIndex;
        $this->definitionResolver = $definitionResolver;
        $this->parser = new PhpParser\Parser();
        $this->docBlockFactory = DocBlockFactory::createInstance();
    }

    /**
     * Returns the document indicated by uri.
     * Returns null if the document if not loaded.
     *
     * @param string $uri
     * @return PhpDocument|null
     */
    public function get(string $uri)
    {
        return $this->documents[$uri] ?? null;
    }

    /**
     * Returns the document indicated by uri.
     * If the document is not open, loads it.
     *
     * @param string $uri
     * @return Promise <PhpDocument>
     */
    public function getOrLoad(string $uri): Promise
    {
        return isset($this->documents[$uri]) ? Promise\resolve($this->documents[$uri]) : $this->load($uri);
    }

    /**
     * Loads the document by doing a textDocument/xcontent request to the client.
     * If the client does not support textDocument/xcontent, tries to read the file from the file system.
     * The document is NOT added to the list of open documents, but definitions are registered.
     *
     * @param string $uri
     * @return Promise <PhpDocument>
     */
    public function load(string $uri): Promise
    {
        return coroutine(function () use ($uri) {

            $limit = 150000;
            $content = yield $this->contentRetriever->retrieve($uri);
            $size = strlen($content);
            if ($size > $limit) {
                throw new ContentTooLargeException($uri, $size, $limit);
            }

            if (isset($this->documents[$uri])) {
                $document = $this->documents[$uri];
                $document->updateContent($content);
            } else {
                $document = $this->create($uri, $content);
            }
            return $document;
        });
    }

    /**
     * Builds a PhpDocument instance
     *
     * @param string $uri
     * @param string $content
     * @return PhpDocument
     */
    public function create(string $uri, string $content): PhpDocument
    {
        return new PhpDocument(
            $uri,
            $content,
            $this->projectIndex->getIndexForUri($uri),
            $this->parser,
            $this->docBlockFactory,
            $this->definitionResolver
        );
    }

    /**
     * Ensures a document is loaded and added to the list of open documents.
     *
     * @param string $uri
     * @param string $content
     * @return void
     */
    public function open(string $uri, string $content)
    {
        if (isset($this->documents[$uri])) {
            $document = $this->documents[$uri];
            $document->updateContent($content);
        } else {
            $document = $this->create($uri, $content);
            $this->documents[$uri] = $document;
        }
        return $document;
    }

    /**
     * Removes the document with the specified URI from the list of open documents
     *
     * @param string $uri
     * @return void
     */
    public function close(string $uri)
    {
        unset($this->documents[$uri]);
    }

    /**
     * Returns true if the document is open (and loaded)
     *
     * @param string $uri
     * @return bool
     */
    public function isOpen(string $uri): bool
    {
        return isset($this->documents[$uri]);
    }
}
