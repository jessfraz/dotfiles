<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server\TextDocument;

use LanguageServer\Tests\Server\ServerTestCase;
use LanguageServer\Tests\MockProtocolStream;
use LanguageServer\{Server, LanguageClient, Project};
use LanguageServerProtocol\{TextDocumentIdentifier, SymbolInformation, SymbolKind, Position, Location, Range};
use function LanguageServer\pathToUri;

class DocumentSymbolTest extends ServerTestCase
{
    public function test()
    {
        // Request symbols
        $uri = pathToUri(realpath(__DIR__ . '/../../../fixtures/symbols.php'));
        $result = $this->textDocument->documentSymbol(new TextDocumentIdentifier($uri))->wait();
        // @codingStandardsIgnoreStart
        $this->assertEquals([
            new SymbolInformation('TestNamespace',      SymbolKind::NAMESPACE,   $this->getDefinitionLocation('TestNamespace'),                                ''),
            new SymbolInformation('TEST_CONST',         SymbolKind::CONSTANT,    $this->getDefinitionLocation('TestNamespace\\TEST_CONST'),                    'TestNamespace'),
            new SymbolInformation('TestClass',          SymbolKind::CLASS_,      $this->getDefinitionLocation('TestNamespace\\TestClass'),                     'TestNamespace'),
            new SymbolInformation('TEST_CLASS_CONST',   SymbolKind::CONSTANT,    $this->getDefinitionLocation('TestNamespace\\TestClass::TEST_CLASS_CONST'),   'TestNamespace\\TestClass'),
            new SymbolInformation('staticTestProperty', SymbolKind::PROPERTY,    $this->getDefinitionLocation('TestNamespace\\TestClass::staticTestProperty'), 'TestNamespace\\TestClass'),
            new SymbolInformation('testProperty',       SymbolKind::PROPERTY,    $this->getDefinitionLocation('TestNamespace\\TestClass::testProperty'),       'TestNamespace\\TestClass'),
            new SymbolInformation('staticTestMethod',   SymbolKind::METHOD,      $this->getDefinitionLocation('TestNamespace\\TestClass::staticTestMethod()'), 'TestNamespace\\TestClass'),
            new SymbolInformation('testMethod',         SymbolKind::METHOD,      $this->getDefinitionLocation('TestNamespace\\TestClass::testMethod()'),       'TestNamespace\\TestClass'),
            new SymbolInformation('TestTrait',          SymbolKind::CLASS_,      $this->getDefinitionLocation('TestNamespace\\TestTrait'),                     'TestNamespace'),
            new SymbolInformation('TestInterface',      SymbolKind::INTERFACE,   $this->getDefinitionLocation('TestNamespace\\TestInterface'),                 'TestNamespace'),
            new SymbolInformation('test_function',      SymbolKind::FUNCTION,    $this->getDefinitionLocation('TestNamespace\\test_function()'),               'TestNamespace'),
            new SymbolInformation('ChildClass',         SymbolKind::CLASS_,      $this->getDefinitionLocation('TestNamespace\\ChildClass'),                    'TestNamespace'),
            new SymbolInformation('Example',            SymbolKind::CLASS_,      $this->getDefinitionLocation('TestNamespace\\Example'),                       'TestNamespace'),
            new SymbolInformation('__construct',        SymbolKind::CONSTRUCTOR, $this->getDefinitionLocation('TestNamespace\\Example::__construct'),          'TestNamespace\\Example'),
            new SymbolInformation('__destruct',         SymbolKind::CONSTRUCTOR, $this->getDefinitionLocation('TestNamespace\\Example::__destruct'),           'TestNamespace\\Example'),
            new SymbolInformation('TestNamespace\\InnerNamespace', SymbolKind::NAMESPACE, $this->getDefinitionLocation('TestNamespace\\InnerNamespace'),       'TestNamespace'),
            new SymbolInformation('InnerClass',         SymbolKind::CLASS_,      $this->getDefinitionLocation('TestNamespace\\InnerNamespace\\InnerClass'),    'TestNamespace\\InnerNamespace'),
        ], $result);
        // @codingStandardsIgnoreEnd
    }
}
