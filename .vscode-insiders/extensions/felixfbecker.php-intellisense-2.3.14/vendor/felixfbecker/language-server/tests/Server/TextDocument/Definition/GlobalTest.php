<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server\TextDocument\Definition;

use LanguageServer\Tests\Server\ServerTestCase;
use LanguageServerProtocol\{TextDocumentIdentifier, Position, Location, Range};
use function LanguageServer\pathToUri;

class GlobalTest extends ServerTestCase
{
    public function testDefinitionFileBeginning()
    {
        // |<?php
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier(pathToUri(realpath(__DIR__ . '/../../../../fixtures/references.php'))),
            new Position(0, 0)
        )->wait();
        $this->assertEquals([], $result);
    }

    public function testDefinitionEmptyResult()
    {
        // namespace keyword
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier(pathToUri(realpath(__DIR__ . '/../../../../fixtures/references.php'))),
            new Position(1, 0)
        )->wait();
        $this->assertEquals([], $result);
    }

    public function testDefinitionForSelfKeyword()
    {
        // echo self::TEST_CLASS_CONST;
        // Get definition for self
        $reference = $this->getReferenceLocations('TestClass')[0];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass'), $result);
    }

    public function testDefinitionForClassLike()
    {
        // $obj = new TestClass();
        // Get definition for TestClass
        $reference = $this->getReferenceLocations('TestClass')[1];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass'), $result);
    }

    public function testDefinitionForClassOnStaticMethodCall()
    {
        // TestClass::staticTestMethod();
        // Get definition for TestClass
        $reference = $this->getReferenceLocations('TestClass')[2];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass'), $result);
    }

    public function testDefinitionForClassOnStaticPropertyFetch()
    {
        // echo TestClass::$staticTestProperty;
        // Get definition for TestClass
        $reference = $this->getReferenceLocations('TestClass')[3];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass'), $result);
    }

    public function testDefinitionForClassOnConstFetch()
    {
        // TestClass::TEST_CLASS_CONST;
        // Get definition for TestClass
        $reference = $this->getReferenceLocations('TestClass')[4];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass'), $result);
    }

    public function testDefinitionForImplements()
    {
        // class TestClass implements TestInterface
        // Get definition for TestInterface
        $reference = $this->getReferenceLocations('TestInterface')[0];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestInterface'), $result);
    }

    public function testDefinitionForClassConstants()
    {
        // echo TestClass::TEST_CLASS_CONST;
        // Get definition for TEST_CLASS_CONST
        $reference = $this->getReferenceLocations('TestClass::TEST_CLASS_CONST')[1];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->end
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass::TEST_CLASS_CONST'), $result);
    }

    public function testDefinitionForClassConstantsOnSelf()
    {
        // echo self::TEST_CLASS_CONST;
        // Get definition for TEST_CLASS_CONST
        $reference = $this->getReferenceLocations('TestClass::TEST_CLASS_CONST')[0];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->end
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass::TEST_CLASS_CONST'), $result);
    }

    public function testDefinitionForConstants()
    {
        // echo TEST_CONST;
        // Get definition for TEST_CONST
        $reference = $this->getReferenceLocations('TEST_CONST')[1];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TEST_CONST'), $result);
    }

    public function testDefinitionForStaticMethods()
    {
        // TestClass::staticTestMethod();
        // Get definition for staticTestMethod
        $reference = $this->getReferenceLocations('TestClass::staticTestMethod()')[0];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->end
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass::staticTestMethod()'), $result);
    }

    public function testDefinitionForStaticProperties()
    {
        // echo TestClass::$staticTestProperty;
        // Get definition for staticTestProperty
        $reference = $this->getReferenceLocations('TestClass::staticTestProperty')[0];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->end
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass::staticTestProperty'), $result);
    }

    public function testDefinitionForMethods()
    {
        // $obj->testMethod();
        // Get definition for testMethod
        $reference = $this->getReferenceLocations('TestClass::testMethod()')[0];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->end
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass::testMethod()'), $result);
    }

    public function testDefinitionForMethodOnChildClass()
    {
        // $child->testMethod();
        // Get definition for testMethod
        $reference = $this->getReferenceLocations('TestClass::testMethod()')[2];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->end
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass::testMethod()'), $result);
    }

    public function testDefinitionForProperties()
    {
        // echo $obj->testProperty;
        // Get definition for testProperty
        $reference = $this->getReferenceLocations('TestClass::testProperty')[1];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->end
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass::testProperty'), $result);
    }

    public function testDefinitionForPropertiesOnThis()
    {
        // $this->testProperty = $testParameter;
        // Get definition for testProperty
        $reference = $this->getReferenceLocations('TestClass::testProperty')[0];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->end
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass::testProperty'), $result);
    }

    public function testDefinitionForVariables()
    {
        // echo $var;
        // Get definition for $var
        $uri = pathToUri(realpath(__DIR__ . '/../../../../fixtures/references.php'));
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($uri),
            new Position(13, 7)
        )->wait();
        $this->assertEquals(new Location($uri, new Range(new Position(12, 0), new Position(12, 10))), $result);
    }

    public function testDefinitionForParamTypeHints()
    {
        // function whatever(TestClass $param) {
        // Get definition for TestClass
        $reference = $this->getReferenceLocations('TestClass')[5];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass'), $result);
    }

    public function testDefinitionForReturnTypeHints()
    {
        // function whatever(TestClass $param): TestClass {
        // Get definition for TestClass
        $reference = $this->getReferenceLocations('TestClass')[6];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass'), $result);
    }

    public function testDefinitionForMethodReturnTypeHints()
    {
        // public function testMethod($testParameter): TestInterface
        // Get definition for TestInterface
        $reference = $this->getReferenceLocations('TestInterface')[1];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestInterface'), $result);
    }

    public function testDefinitionForParams()
    {
        // echo $param;
        // Get definition for $param
        $uri = pathToUri(realpath(__DIR__ . '/../../../../fixtures/references.php'));
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($uri),
            new Position(22, 13)
        )->wait();
        $this->assertEquals(new Location($uri, new Range(new Position(21, 18), new Position(21, 34))), $result);
    }

    public function testDefinitionForUsedVariables()
    {
        // echo $var;
        // Get definition for $var
        $uri = pathToUri(realpath(__DIR__ . '/../../../../fixtures/references.php'));
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($uri),
            new Position(26, 11)
        )->wait();
        $this->assertEquals(new Location($uri, new Range(new Position(25, 22), new Position(25, 26))), $result);
    }

    public function testDefinitionForFunctions()
    {
        // test_function();
        // Get definition for test_function
        $reference = $this->getReferenceLocations('test_function()')[0];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('test_function()'), $result);
    }

    public function testDefinitionForUseFunctions()
    {
        // use function test_function;
        // Get definition for test_function
        $reference = $this->getReferenceLocations('test_function()')[1];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('test_function()'), $result);
    }

    public function testDefinitionForInstanceOf()
    {
        // if ($abc instanceof TestInterface) {
        // Get definition for TestInterface
        $reference = $this->getReferenceLocations('TestInterface')[2];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->start
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestInterface'), $result);
    }

    public function testDefinitionForNestedMethodCall()
    {
        // $obj->testProperty->testMethod();
        // Get definition for testMethod
        $reference = $this->getReferenceLocations('TestClass::testMethod()')[1];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->end
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass::testMethod()'), $result);
    }

    public function testDefinitionForPropertyFetchOnArrayDimFetch()
    {
        // TestClass::$staticTestProperty[123]->testProperty;
        // Get definition for testProperty
        $reference = $this->getReferenceLocations('TestClass::testProperty')[3];
        $result = $this->textDocument->definition(
            new TextDocumentIdentifier($reference->uri),
            $reference->range->end
        )->wait();
        $this->assertEquals($this->getDefinitionLocation('TestClass::testProperty'), $result);
    }
}
