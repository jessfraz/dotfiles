<?php
declare(strict_types = 1);

namespace LanguageServer\Client;

use LanguageServer\ClientHandler;
use LanguageServerProtocol\TextDocumentIdentifier;
use Sabre\Event\Promise;
use JsonMapper;

/**
 * Provides method handlers for all workspace/* methods
 */
class Workspace
{
    /**
     * @var ClientHandler
     */
    private $handler;

    /**
     * @var JsonMapper
     */
    private $mapper;

    public function __construct(ClientHandler $handler, JsonMapper $mapper)
    {
        $this->handler = $handler;
        $this->mapper = $mapper;
    }

    /**
     * Returns a list of all files in a directory
     *
     * @param string $base The base directory (defaults to the workspace)
     * @return Promise <TextDocumentIdentifier[]> Array of documents
     */
    public function xfiles(string $base = null): Promise
    {
        return $this->handler->request(
            'workspace/xfiles',
            ['base' => $base]
        )->then(function (array $textDocuments) {
            return $this->mapper->mapArray($textDocuments, [], TextDocumentIdentifier::class);
        });
    }
}
