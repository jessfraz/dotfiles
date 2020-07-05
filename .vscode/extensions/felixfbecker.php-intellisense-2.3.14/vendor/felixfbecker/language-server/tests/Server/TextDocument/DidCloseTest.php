<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server\TextDocument;

use PHPUnit\Framework\TestCase;
use LanguageServer\Tests\MockProtocolStream;
use LanguageServer\{
    Server, LanguageClient, PhpDocumentLoader, DefinitionResolver
};
use LanguageServer\ContentRetriever\FileSystemContentRetriever;
use LanguageServer\Index\{Index, ProjectIndex, DependenciesIndex};
use LanguageServerProtocol\{TextDocumentItem, TextDocumentIdentifier};

class DidCloseTest extends TestCase
{
    public function test()
    {
        $projectIndex = new ProjectIndex(new Index, new DependenciesIndex);
        $client = new LanguageClient(new MockProtocolStream, new MockProtocolStream);
        $definitionResolver = new DefinitionResolver($projectIndex);
        $loader = new PhpDocumentLoader(new FileSystemContentRetriever, $projectIndex, $definitionResolver);
        $textDocument = new Server\TextDocument($loader, $definitionResolver, $client, $projectIndex);
        $phpDocument = $loader->open('whatever', "<?php\necho 'Hello, World'\n");

        $textDocumentItem = new TextDocumentItem();
        $textDocumentItem->uri = 'whatever';
        $textDocumentItem->languageId = 'php';
        $textDocumentItem->version = 1;
        $textDocumentItem->text = 'hello world';
        $textDocument->didOpen($textDocumentItem);

        $textDocument->didClose(new TextDocumentIdentifier($textDocumentItem->uri));

        $this->assertFalse($loader->isOpen($textDocumentItem->uri));
    }
}
