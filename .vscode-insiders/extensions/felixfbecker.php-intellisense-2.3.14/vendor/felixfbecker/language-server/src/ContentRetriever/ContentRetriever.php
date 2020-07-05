<?php
declare(strict_types = 1);

namespace LanguageServer\ContentRetriever;

use Sabre\Event\Promise;

/**
 * Interface for retrieving the content of a text document
 */
interface ContentRetriever
{
    /**
     * Retrieves the content of a text document identified by the URI
     *
     * @param string $uri The URI of the document
     * @return Promise <string> Resolved with the content as a string
     */
    public function retrieve(string $uri): Promise;
}
