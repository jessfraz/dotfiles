<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server\TextDocument\References;

use LanguageServerProtocol\{TextDocumentIdentifier, Position, ReferenceContext, Location, Range};
use LanguageServer\Tests\Server\ServerTestCase;
use function LanguageServer\pathToUri;

class GlobalTest extends ServerTestCase
{
    public function testReferencesForClassLike()
    {
        // class TestClass implements TestInterface
        // Get references for TestClass
        $definition = $this->getDefinitionLocation('TestClass');
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($definition->uri),
            $definition->range->start
        )->wait();
        $this->assertEquals($this->getReferenceLocations('TestClass'), $result);
    }

    public function testReferencesForClassConstants()
    {
        // const TEST_CLASS_CONST = 123;
        // Get references for TEST_CLASS_CONST
        $definition = $this->getDefinitionLocation('TestClass::TEST_CLASS_CONST');
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($definition->uri),
            $definition->range->start
        )->wait();
        $this->assertEquals($this->getReferenceLocations('TestClass::TEST_CLASS_CONST'), $result);
    }

    public function testReferencesForConstants()
    {
        // const TEST_CONST = 123;
        // Get references for TEST_CONST
        $definition = $this->getDefinitionLocation('TEST_CONST');
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($definition->uri),
            $definition->range->start
        )->wait();
        $this->assertEquals($this->getReferenceLocations('TEST_CONST'), $result);
    }

    public function testReferencesForStaticMethods()
    {
        // public static function staticTestMethod()
        // Get references for staticTestMethod
        $definition = $this->getDefinitionLocation('TestClass::staticTestMethod()');
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($definition->uri),
            $definition->range->start
        )->wait();
        $this->assertEquals($this->getReferenceLocations('TestClass::staticTestMethod()'), $result);
    }

    public function testReferencesForStaticProperties()
    {
        // public static $staticTestProperty;
        // Get references for $staticTestProperty
        $definition = $this->getDefinitionLocation('TestClass::staticTestProperty');
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($definition->uri),
            $definition->range->start
        )->wait();
        $this->assertEquals($this->getReferenceLocations('TestClass::staticTestProperty'), $result);
    }

    public function testReferencesForMethods()
    {
        // public function testMethod($testParameter)
        // Get references for testMethod
        $definition = $this->getDefinitionLocation('TestClass::testMethod()');
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($definition->uri),
            $definition->range->start
        )->wait();
        $this->assertEquals($this->getReferenceLocations('TestClass::testMethod()'), $result);
    }

    public function testReferencesForProperties()
    {
        // public $testProperty;
        // Get references for testProperty
        $definition = $this->getDefinitionLocation('TestClass::testProperty');
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($definition->uri),
            $definition->range->start
        )->wait();
        $this->assertEquals($this->getReferenceLocations('TestClass::testProperty'), $result);
    }

    public function testReferencesForVariables()
    {
        // $var = 123;
        // Get definition for $var
        $uri = pathToUri(realpath(__DIR__ . '/../../../../fixtures/references.php'));
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($uri),
            new Position(12, 3)
        )->wait();
        $this->assertEquals([
            new Location($uri, new Range(new Position(12, 0), new Position(12, 4))),
            new Location($uri, new Range(new Position(13, 5), new Position(13, 9))),
            new Location($uri, new Range(new Position(26, 9), new Position(26, 13)))
        ], $result);
    }

    public function testReferencesForFunctionParams()
    {
        // function whatever(TestClass $param): TestClass
        // Get references for $param
        $uri = pathToUri(realpath(__DIR__ . '/../../../../fixtures/references.php'));
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($uri),
            new Position(21, 32)
        )->wait();
        $this->assertEquals([new Location($uri, new Range(new Position(22, 9), new Position(22, 15)))], $result);
    }

    public function testReferencesForFunctions()
    {
        // function test_function()
        // Get references for test_function
        $referencesUri = pathToUri(realpath(__DIR__ . '/../../../../fixtures/references.php'));
        $symbolsUri    = pathToUri(realpath(__DIR__ . '/../../../../fixtures/symbols.php'));
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($symbolsUri),
            new Position(78, 16)
        )->wait();
        $this->assertEquals([
            new Location($referencesUri, new Range(new Position(10, 0), new Position(10, 13))),
            new Location($referencesUri, new Range(new Position(31, 13), new Position(31, 40)))
        ], $result);
    }

    public function testReferencesForReference()
    {
        // $obj = new TestClass();
        // Get references for TestClass
        $reference = $this->getReferenceLocations('TestClass')[1];
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getReferenceLocations('TestClass'), $result);
    }

    public function testReferencesForUnusedClass()
    {
        // class UnusedClass
        // Get references for UnusedClass
        $symbolsUri = pathToUri(realpath(__DIR__ . '/../../../../fixtures/global_symbols.php'));
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($symbolsUri),
            new Position(111, 10)
        )->wait();
        $this->assertEquals([], $result);
    }

    public function testReferencesForUnusedProperty()
    {
        // public $unusedProperty
        // Get references for unusedProperty
        $symbolsUri = pathToUri(realpath(__DIR__ . '/../../../../fixtures/global_symbols.php'));
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($symbolsUri),
            new Position(113, 18)
        )->wait();
        $this->assertEquals([], $result);
    }

    public function testReferencesForUnusedMethod()
    {
        // public function unusedMethod()
        // Get references for unusedMethod
        $symbolsUri = pathToUri(realpath(__DIR__ . '/../../../../fixtures/global_symbols.php'));
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($symbolsUri),
            new Position(115, 26)
        )->wait();
        $this->assertEquals([], $result);
    }
}
