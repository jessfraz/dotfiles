<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server\Workspace;

use LanguageServer\Tests\MockProtocolStream;
use LanguageServer\Tests\Server\ServerTestCase;
use LanguageServer\{Server, Client, LanguageClient, Project, PhpDocument};
use LanguageServerProtocol\{
    TextDocumentItem,
    TextDocumentIdentifier,
    SymbolInformation,
    SymbolKind,
    DiagnosticSeverity,
    FormattingOptions,
    Location,
    Range,
    Position
};
use AdvancedJsonRpc\{Request as RequestBody, Response as ResponseBody};
use function LanguageServer\pathToUri;

class SymbolTest extends ServerTestCase
{
    public function testEmptyQueryReturnsAllSymbols()
    {
        // Request symbols
        $result = $this->workspace->symbol('')->wait();
        $referencesUri = pathToUri(realpath(__DIR__ . '/../../../fixtures/references.php'));

        // @codingStandardsIgnoreStart
        $this->assertEquals([
            new SymbolInformation('TestNamespace',          SymbolKind::NAMESPACE,   new Location($referencesUri, new Range(new Position(2, 0), new Position(2, 24))), ''),
            // Namespaced
            new SymbolInformation('TEST_CONST',             SymbolKind::CONSTANT,    $this->getDefinitionLocation('TestNamespace\\TEST_CONST'),                    'TestNamespace'),
            new SymbolInformation('TestClass',              SymbolKind::CLASS_,      $this->getDefinitionLocation('TestNamespace\\TestClass'),                     'TestNamespace'),
            new SymbolInformation('TEST_CLASS_CONST',       SymbolKind::CONSTANT,    $this->getDefinitionLocation('TestNamespace\\TestClass::TEST_CLASS_CONST'),   'TestNamespace\\TestClass'),
            new SymbolInformation('staticTestProperty',     SymbolKind::PROPERTY,    $this->getDefinitionLocation('TestNamespace\\TestClass::staticTestProperty'), 'TestNamespace\\TestClass'),
            new SymbolInformation('testProperty',           SymbolKind::PROPERTY,    $this->getDefinitionLocation('TestNamespace\\TestClass::testProperty'),       'TestNamespace\\TestClass'),
            new SymbolInformation('staticTestMethod',       SymbolKind::METHOD,      $this->getDefinitionLocation('TestNamespace\\TestClass::staticTestMethod()'), 'TestNamespace\\TestClass'),
            new SymbolInformation('testMethod',             SymbolKind::METHOD,      $this->getDefinitionLocation('TestNamespace\\TestClass::testMethod()'),       'TestNamespace\\TestClass'),
            new SymbolInformation('TestTrait',              SymbolKind::CLASS_,      $this->getDefinitionLocation('TestNamespace\\TestTrait'),                     'TestNamespace'),
            new SymbolInformation('TestInterface',          SymbolKind::INTERFACE,   $this->getDefinitionLocation('TestNamespace\\TestInterface'),                 'TestNamespace'),
            new SymbolInformation('test_function',          SymbolKind::FUNCTION,    $this->getDefinitionLocation('TestNamespace\\test_function()'),               'TestNamespace'),
            new SymbolInformation('ChildClass',             SymbolKind::CLASS_,      $this->getDefinitionLocation('TestNamespace\\ChildClass'),                    'TestNamespace'),
            new SymbolInformation('Example',                SymbolKind::CLASS_,      $this->getDefinitionLocation('TestNamespace\\Example'),                       'TestNamespace'),
            new SymbolInformation('__construct',            SymbolKind::CONSTRUCTOR, $this->getDefinitionLocation('TestNamespace\\Example::__construct'),          'TestNamespace\\Example'),
            new SymbolInformation('__destruct',             SymbolKind::CONSTRUCTOR, $this->getDefinitionLocation('TestNamespace\\Example::__destruct'),           'TestNamespace\\Example'),
            new SymbolInformation('TestNamespace\\InnerNamespace', SymbolKind::NAMESPACE, $this->getDefinitionLocation('TestNamespace\\InnerNamespace'),           'TestNamespace'),
            new SymbolInformation('InnerClass',             SymbolKind::CLASS_,      $this->getDefinitionLocation('TestNamespace\\InnerNamespace\\InnerClass'),    'TestNamespace\\InnerNamespace'),
            new SymbolInformation('whatever',               SymbolKind::FUNCTION,    $this->getDefinitionLocation('TestNamespace\\whatever()'),                    'TestNamespace'),
            // Global
            new SymbolInformation('TEST_CONST',             SymbolKind::CONSTANT,    $this->getDefinitionLocation('TEST_CONST'),                                   ''),
            new SymbolInformation('TestClass',              SymbolKind::CLASS_,      $this->getDefinitionLocation('TestClass'),                                    ''),
            new SymbolInformation('TEST_CLASS_CONST',       SymbolKind::CONSTANT,    $this->getDefinitionLocation('TestClass::TEST_CLASS_CONST'),                  'TestClass'),
            new SymbolInformation('staticTestProperty',     SymbolKind::PROPERTY,    $this->getDefinitionLocation('TestClass::staticTestProperty'),                'TestClass'),
            new SymbolInformation('testProperty',           SymbolKind::PROPERTY,    $this->getDefinitionLocation('TestClass::testProperty'),                      'TestClass'),
            new SymbolInformation('staticTestMethod',       SymbolKind::METHOD,      $this->getDefinitionLocation('TestClass::staticTestMethod()'),                'TestClass'),
            new SymbolInformation('testMethod',             SymbolKind::METHOD,      $this->getDefinitionLocation('TestClass::testMethod()'),                      'TestClass'),
            new SymbolInformation('TestTrait',              SymbolKind::CLASS_,      $this->getDefinitionLocation('TestTrait'),                                    ''),
            new SymbolInformation('TestInterface',          SymbolKind::INTERFACE,   $this->getDefinitionLocation('TestInterface'),                                ''),
            new SymbolInformation('test_function',          SymbolKind::FUNCTION,    $this->getDefinitionLocation('test_function()'),                              ''),
            new SymbolInformation('ChildClass',             SymbolKind::CLASS_,      $this->getDefinitionLocation('ChildClass'),                                   ''),
            new SymbolInformation('TEST_DEFINE_CONSTANT',   SymbolKind::CONSTANT,    $this->getDefinitionLocation('TEST_DEFINE_CONSTANT'),                         ''),
            new SymbolInformation('UnusedClass',            SymbolKind::CLASS_,      $this->getDefinitionLocation('UnusedClass'),                                  ''),
            new SymbolInformation('unusedProperty',         SymbolKind::PROPERTY,    $this->getDefinitionLocation('UnusedClass::unusedProperty'),                  'UnusedClass'),
            new SymbolInformation('unusedMethod',           SymbolKind::METHOD,      $this->getDefinitionLocation('UnusedClass::unusedMethod'),                    'UnusedClass'),
            new SymbolInformation('whatever',               SymbolKind::FUNCTION,    $this->getDefinitionLocation('whatever()'),                                   ''),

            new SymbolInformation('SecondTestNamespace',    SymbolKind::NAMESPACE,   $this->getDefinitionLocation('SecondTestNamespace'),                          ''),
        ], $result);
        // @codingStandardsIgnoreEnd
    }

    public function testQueryFiltersResults()
    {
        // Request symbols
        $result = $this->workspace->symbol('testmethod')->wait();
        // @codingStandardsIgnoreStart
        $this->assertEquals([
            new SymbolInformation('staticTestMethod',   SymbolKind::METHOD,    $this->getDefinitionLocation('TestNamespace\\TestClass::staticTestMethod()'), 'TestNamespace\\TestClass'),
            new SymbolInformation('testMethod',         SymbolKind::METHOD,    $this->getDefinitionLocation('TestNamespace\\TestClass::testMethod()'),       'TestNamespace\\TestClass'),
            new SymbolInformation('staticTestMethod',   SymbolKind::METHOD,    $this->getDefinitionLocation('TestClass::staticTestMethod()'),                'TestClass'),
            new SymbolInformation('testMethod',         SymbolKind::METHOD,    $this->getDefinitionLocation('TestClass::testMethod()'),                      'TestClass')
        ], $result);
        // @codingStandardsIgnoreEnd
    }
}
