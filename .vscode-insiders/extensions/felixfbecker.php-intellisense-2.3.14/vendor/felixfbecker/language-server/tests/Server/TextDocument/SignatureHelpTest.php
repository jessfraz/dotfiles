<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server\TextDocument;

use PHPUnit\Framework\TestCase;
use LanguageServer\Tests\MockProtocolStream;
use LanguageServer\{
    Server, LanguageClient, PhpDocumentLoader, DefinitionResolver
};
use LanguageServer\Index\{Index, ProjectIndex, DependenciesIndex};
use LanguageServer\ContentRetriever\FileSystemContentRetriever;
use LanguageServerProtocol\{
    TextDocumentIdentifier,
    TextEdit,
    Range,
    Position,
    SignatureHelp,
    SignatureInformation,
    ParameterInformation
};
use function LanguageServer\pathToUri;

class SignatureHelpTest extends TestCase
{
    /**
     * @var Server\TextDocument
     */
    private $textDocument;

    /**
     * @var PhpDocumentLoader
     */
    private $loader;

    public function setUp()
    {
        $client = new LanguageClient(new MockProtocolStream, new MockProtocolStream);
        $index = new Index();
        $projectIndex = new ProjectIndex($index, new DependenciesIndex);
        $definitionResolver = new DefinitionResolver($projectIndex);
        $contentRetriever = new FileSystemContentRetriever;
        $this->loader = new PhpDocumentLoader($contentRetriever, $projectIndex, $definitionResolver);
        $this->textDocument = new Server\TextDocument($this->loader, $definitionResolver, $client, $projectIndex);
        $index->setComplete();
    }

    /**
     * @dataProvider signatureHelpProvider
     */
    public function testSignatureHelp(Position $position, SignatureHelp $expectedSignature)
    {
        $callsUri = pathToUri(__DIR__ . '/../../../fixtures/signature_help/calls.php');
        $this->loader->open($callsUri, file_get_contents($callsUri));
        $signatureHelp = $this->textDocument->signatureHelp(
            new TextDocumentIdentifier($callsUri),
            $position
        )->wait();
        $this->assertEquals($expectedSignature, $signatureHelp);
    }

    public function signatureHelpProvider(): array
    {
        return [
            'member call' => [
                new Position(50, 9),
                new SignatureHelp(
                    [
                        new SignatureInformation(
                            '(\\Foo\\SomethingElse $a, int|null $b = null)',
                            [
                                new ParameterInformation('\\Foo\\SomethingElse $a', 'A param with a different doc type'),
                                new ParameterInformation('int|null $b = null', 'Param with default value'),
                            ],
                            'Function doc'
                        )
                    ],
                    0,
                    0
                ),
            ],
            'member call 2nd param active' => [
                new Position(51, 12),
                new SignatureHelp(
                    [
                        new SignatureInformation(
                            '(\\Foo\\SomethingElse $a, int|null $b = null)',
                            [
                                new ParameterInformation('\\Foo\\SomethingElse $a', 'A param with a different doc type'),
                                new ParameterInformation('int|null $b = null', 'Param with default value'),
                            ],
                            'Function doc'
                        )
                    ],
                    0,
                    1
                ),
            ],
            'member call 2nd param active and closing )' => [
                new Position(52, 11),
                new SignatureHelp(
                    [
                        new SignatureInformation(
                            '(\\Foo\\SomethingElse $a, int|null $b = null)',
                            [
                                new ParameterInformation('\\Foo\\SomethingElse $a', 'A param with a different doc type'),
                                new ParameterInformation('int|null $b = null', 'Param with default value'),
                            ],
                            'Function doc'
                        )
                    ],
                    0,
                    1
                ),
            ],
            'method with no params' => [
                new Position(53, 9),
                new SignatureHelp([new SignatureInformation('()', [], 'Method with no params', 0, 0)]),
            ],
            'constructor' => [
                new Position(48, 14),
                new SignatureHelp(
                    [
                        new SignatureInformation(
                            '(string $first, int $second, \Foo\Test $third)',
                            [
                                new ParameterInformation('string $first', 'First param'),
                                new ParameterInformation('int $second', 'Second param'),
                                new ParameterInformation('\Foo\Test $third', 'Third param with a longer description'),
                            ],
                            'Constructor comment goes here'
                        )
                    ],
                    0,
                    0
                ),
            ],
            'constructor argument expression list' => [
                new Position(49, 16),
                new SignatureHelp(
                    [
                        new SignatureInformation(
                            '(string $first, int $second, \Foo\Test $third)',
                            [
                                new ParameterInformation('string $first', 'First param'),
                                new ParameterInformation('int $second', 'Second param'),
                                new ParameterInformation('\Foo\Test $third', 'Third param with a longer description'),
                            ],
                            'Constructor comment goes here'
                        )
                    ],
                    0,
                    1
                ),
            ],
            'global function' => [
                new Position(57, 15),
                new SignatureHelp(
                    [
                        new SignatureInformation(
                            '(int $i, bool $b = false, \Foo\Test|null ...$things = null)',
                            [
                                new ParameterInformation('int $i', 'Global function param one'),
                                new ParameterInformation('bool $b = false', 'Default false param'),
                                new ParameterInformation('\Foo\Test|null ...$things = null', 'Test things'),
                            ]
                        ),
                    ],
                    0,
                    2
                )
            ],
            'static method' => [
                new Position(60, 10),
                new SignatureHelp(
                    [new SignatureInformation('(mixed $a)', [new ParameterInformation('mixed $a')])],
                    0,
                    0
                ),
            ],
            'no signature help' => [
                new Position(0, 0),
                new SignatureHelp([]),
            ],
            'construct from non fqn (not supported)' => [
                new Position(62, 9),
                new SignatureHelp([]),
            ],
            'construct from non fqn (not supported) argument expression' => [
                new Position(63, 11),
                new SignatureHelp([]),
            ],
            'invalid var' => [
                new Position(65, 13),
                new SignatureHelp([]),
            ],
        ];
    }
}
