<?php
declare(strict_types = 1);

namespace LanguageServer\ContentRetriever;

use LanguageServer\LanguageClient;
use LanguageServerProtocol\{TextDocumentIdentifier, TextDocumentItem};
use Sabre\Event\Promise;

/**
 * Retrieves file content from the client through a textDocument/xcontent request
 */
class ClientContentRetriever implements ContentRetriever
{
    /**
     * @param LanguageClient $client
     */
    public function __construct(LanguageClient $client)
    {
        $this->client = $client;
    }

    /**
     * Retrieves the content of a text document identified by the URI through a textDocument/xcontent request
     *
     * @param string $uri The URI of the document
     * @return Promise <string> Resolved with the content as a string
     */
    public function retrieve(string $uri): Promise
    {
        return $this->client->textDocument->xcontent(new TextDocumentIdentifier($uri))
            ->then(function (TextDocumentItem $textDocument) {
                return $textDocument->text;
            });
    }
}
