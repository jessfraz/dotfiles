<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server\TextDocument;

use PHPUnit\Framework\TestCase;
use LanguageServer\Tests\MockProtocolStream;
use LanguageServer\{
    Server, Client, LanguageClient, ClientHandler, PhpDocumentLoader, DefinitionResolver
};
use LanguageServer\Index\{Index, ProjectIndex, DependenciesIndex};
use LanguageServer\ContentRetriever\FileSystemContentRetriever;
use LanguageServerProtocol\{TextDocumentItem, DiagnosticSeverity};
use Sabre\Event\Promise;
use JsonMapper;

class ParseErrorsTest extends TestCase
{
    /**
     * @var Server\TextDocument
     */
    private $textDocument;

    private $args;

    public function setUp()
    {
        $client = new LanguageClient(new MockProtocolStream, new MockProtocolStream);
        $client->textDocument = new class($this->args) extends Client\TextDocument {
            private $args;
            public function __construct(&$args)
            {
                parent::__construct(new ClientHandler(new MockProtocolStream, new MockProtocolStream), new JsonMapper);
                $this->args = &$args;
            }
            public function publishDiagnostics(string $uri, array $diagnostics): Promise
            {
                $this->args = func_get_args();
                return Promise\resolve(null);
            }
        };
        $projectIndex = new ProjectIndex(new Index, new DependenciesIndex);
        $definitionResolver = new DefinitionResolver($projectIndex);
        $loader = new PhpDocumentLoader(new FileSystemContentRetriever, $projectIndex, $definitionResolver);
        $this->textDocument = new Server\TextDocument($loader, $definitionResolver, $client, $projectIndex);
    }

    private function openFile($file)
    {
        $textDocumentItem = new TextDocumentItem();
        $textDocumentItem->uri = 'whatever';
        $textDocumentItem->languageId = 'php';
        $textDocumentItem->version = 1;
        $textDocumentItem->text = file_get_contents($file);
        $this->textDocument->didOpen($textDocumentItem);
    }

    public function testParseErrorsArePublishedAsDiagnostics()
    {
        $this->openFile(__DIR__ . '/../../../fixtures/invalid_file.php');
        $this->assertEquals([
            'whatever',
            [[
                'range' => [
                    'start' => [
                        'line' => 2,
                        'character' => 9
                    ],
                    'end' => [
                        'line' => 2,
                        'character' => 9
                    ]
                ],
                'severity' => DiagnosticSeverity::ERROR,
                'code' => null,
                'source' => 'php',
                'message' => "'Name' expected."
            ],
            [
                'range' => [
                    'start' => [
                        'line' => 2,
                        'character' => 9
                    ],
                    'end' => [
                        'line' => 2,
                        'character' => 9
                    ]
                ],
                'severity' => DiagnosticSeverity::ERROR,
                'code' => null,
                'source' => 'php',
                'message' => "'{' expected."
            ],
            [
                'range' => [
                    'start' => [
                        'line' => 2,
                        'character' => 9
                    ],
                    'end' => [
                        'line' => 2,
                        'character' => 9
                    ]
                ],
                'severity' => DiagnosticSeverity::ERROR,
                'code' => null,
                'source' => 'php',
                'message' => "'}' expected."
            ],
            [
                'range' => [
                    'start' => [
                        'line' => 2,
                        'character' => 15
                    ],
                    'end' => [
                        'line' => 2,
                        'character' => 15
                    ]
                ],
                'severity' => DiagnosticSeverity::ERROR,
                'code' => null,
                'source' => 'php',
                'message' => "'Name' expected."
            ]]
        ], json_decode(json_encode($this->args), true));
    }

    public function testParseErrorsWithOnlyStartLine()
    {
        $this->markTestIncomplete('This diagnostic not yet implemented in tolerant-php-parser');
        $this->openFile(__DIR__ . '/../../../fixtures/namespace_not_first.php');
        $this->assertEquals([
            'whatever',
            [[
                'range' => [
                    'start' => [
                        'line' => 4,
                        'character' => 0
                    ],
                    'end' => [
                        'line' => 4,
                        'character' => 0
                    ]
                ],
                'severity' => DiagnosticSeverity::ERROR,
                'code' => null,
                'source' => 'php',
                'message' => "Namespace declaration statement has to be the very first statement in the script"
            ]]
        ], json_decode(json_encode($this->args), true));
    }
}
