<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server\Workspace;

use LanguageServer\ContentRetriever\FileSystemContentRetriever;
use LanguageServer\{DefinitionResolver, LanguageClient, PhpDocumentLoader, Server};
use LanguageServer\Index\{DependenciesIndex, Index, ProjectIndex};
use LanguageServerProtocol\{FileChangeType, FileEvent};
use LanguageServer\Message;
use LanguageServer\Tests\MockProtocolStream;
use LanguageServer\Tests\Server\ServerTestCase;
use LanguageServer\Server\Workspace;
use Sabre\Event\Loop;

class DidChangeWatchedFilesTest extends ServerTestCase
{
    public function testDeletingFileClearsAllDiagnostics()
    {
        $client = new LanguageClient(new MockProtocolStream(), $writer = new MockProtocolStream());
        $projectIndex = new ProjectIndex($sourceIndex = new Index(), $dependenciesIndex = new DependenciesIndex());
        $definitionResolver = new DefinitionResolver($projectIndex);
        $loader = new PhpDocumentLoader(new FileSystemContentRetriever(), $projectIndex, $definitionResolver);
        $workspace = new Server\Workspace($client, $projectIndex, $dependenciesIndex, $sourceIndex, null, $loader, null);

        $fileEvent = new FileEvent('my uri', FileChangeType::DELETED);

        $isDiagnosticsCleared = false;
        $writer->on('message', function (Message $message) use ($fileEvent, &$isDiagnosticsCleared) {
            if ($message->body->method === "textDocument/publishDiagnostics") {
                $this->assertEquals($message->body->params->uri, $fileEvent->uri);
                $this->assertEquals($message->body->params->diagnostics, []);
                $isDiagnosticsCleared = true;
            }
        });

        $workspace->didChangeWatchedFiles([$fileEvent]);
        Loop\tick(true);

        $this->assertTrue($isDiagnosticsCleared, "Deleting file should clear all diagnostics.");
    }
}
