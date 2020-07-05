<?php
declare(strict_types = 1);

namespace LanguageServer\FilesFinder;

use LanguageServer\LanguageClient;
use Sabre\Event\Promise;
use Sabre\Uri;
use Webmozart\Glob\Glob;

/**
 * Retrieves file content from the client through a textDocument/xcontent request
 */
class ClientFilesFinder implements FilesFinder
{
    /**
     * @var LanguageClient
     */
    private $client;

    /**
     * @param LanguageClient $client
     */
    public function __construct(LanguageClient $client)
    {
        $this->client = $client;
    }

    /**
     * Returns all files in the workspace that match a glob.
     * If the client does not support workspace/files, it falls back to searching the file system directly.
     *
     * @param string $glob
     * @return Promise <string[]> The URIs
     */
    public function find(string $glob): Promise
    {
        return $this->client->workspace->xfiles()->then(function (array $textDocuments) use ($glob) {
            $uris = [];
            foreach ($textDocuments as $textDocument) {
                $path = Uri\parse($textDocument->uri)['path'];
                if (Glob::match($path, $glob)) {
                    $uris[] = $textDocument->uri;
                }
            }
            return $uris;
        });
    }
}
