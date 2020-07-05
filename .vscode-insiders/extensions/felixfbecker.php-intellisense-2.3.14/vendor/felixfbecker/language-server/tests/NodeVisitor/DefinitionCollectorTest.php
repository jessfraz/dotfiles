<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server\TextDocument;

use PHPUnit\Framework\TestCase;
use phpDocumentor\Reflection\DocBlockFactory;
use LanguageServer\{
    DefinitionResolver, TreeAnalyzer
};
use LanguageServer\Index\{Index};
use function LanguageServer\pathToUri;
use Microsoft\PhpParser;
use Microsoft\PhpParser\Node;

class DefinitionCollectorTest extends TestCase
{
    public function testCollectsSymbols()
    {
        $path = realpath(__DIR__ . '/../../fixtures/symbols.php');
        $defNodes = $this->collectDefinitions($path);

        $this->assertEquals([
            'TestNamespace',
            'TestNamespace\\TEST_CONST',
            'TestNamespace\\TestClass',
            'TestNamespace\\TestClass::TEST_CLASS_CONST',
            'TestNamespace\\TestClass::$staticTestProperty',
            'TestNamespace\\TestClass->testProperty',
            'TestNamespace\\TestClass::staticTestMethod()',
            'TestNamespace\\TestClass->testMethod()',
            'TestNamespace\\TestTrait',
            'TestNamespace\\TestInterface',
            'TestNamespace\\test_function()',
            'TestNamespace\\ChildClass',
            'TestNamespace\\Example',
            'TestNamespace\\Example->__construct()',
            'TestNamespace\\Example->__destruct()',
            'TestNamespace\\InnerNamespace',
            'TestNamespace\\InnerNamespace\\InnerClass',
        ], array_keys($defNodes));

        $this->assertInstanceOf(Node\ConstElement::class, $defNodes['TestNamespace\\TEST_CONST']);
        $this->assertInstanceOf(Node\Statement\ClassDeclaration::class, $defNodes['TestNamespace\\TestClass']);
        $this->assertInstanceOf(Node\ConstElement::class, $defNodes['TestNamespace\\TestClass::TEST_CLASS_CONST']);
        // TODO - should we parse properties more strictly?
        $this->assertInstanceOf(Node\Expression\Variable::class, $defNodes['TestNamespace\\TestClass::$staticTestProperty']);
        $this->assertInstanceOf(Node\Expression\Variable::class, $defNodes['TestNamespace\\TestClass->testProperty']);
        $this->assertInstanceOf(Node\MethodDeclaration::class, $defNodes['TestNamespace\\TestClass::staticTestMethod()']);
        $this->assertInstanceOf(Node\MethodDeclaration::class, $defNodes['TestNamespace\\TestClass->testMethod()']);
        $this->assertInstanceOf(Node\Statement\TraitDeclaration::class, $defNodes['TestNamespace\\TestTrait']);
        $this->assertInstanceOf(Node\Statement\InterfaceDeclaration::class, $defNodes['TestNamespace\\TestInterface']);
        $this->assertInstanceOf(Node\Statement\FunctionDeclaration::class, $defNodes['TestNamespace\\test_function()']);
        $this->assertInstanceOf(Node\Statement\ClassDeclaration::class, $defNodes['TestNamespace\\ChildClass']);
        $this->assertInstanceOf(Node\Statement\ClassDeclaration::class, $defNodes['TestNamespace\\Example']);
        $this->assertInstanceOf(Node\MethodDeclaration::class, $defNodes['TestNamespace\\Example->__construct()']);
        $this->assertInstanceOf(Node\MethodDeclaration::class, $defNodes['TestNamespace\\Example->__destruct()']);
        $this->assertInstanceOf(Node\Statement\ClassDeclaration::class, $defNodes['TestNamespace\\InnerNamespace\\InnerClass']);
    }

    public function testDoesNotCollectReferences()
    {
        $path = realpath(__DIR__ . '/../../fixtures/references.php');
        $defNodes = $this->collectDefinitions($path);

        $this->assertEquals(['TestNamespace', 'TestNamespace\\whatever()'], array_keys($defNodes));
        $this->assertInstanceOf(Node\Statement\NamespaceDefinition::class, $defNodes['TestNamespace']);
        $this->assertInstanceOf(Node\Statement\FunctionDeclaration::class, $defNodes['TestNamespace\\whatever()']);
    }

    /**
     * @param $path
     */
    private function collectDefinitions(string $path): array
    {
        $uri = pathToUri($path);
        $parser = new PhpParser\Parser();

        $docBlockFactory = DocBlockFactory::createInstance();
        $index = new Index;
        $definitionResolver = new DefinitionResolver($index);
        $content = file_get_contents($path);

        $treeAnalyzer = new TreeAnalyzer($parser, $content, $docBlockFactory, $definitionResolver, $uri);
        return $treeAnalyzer->getDefinitionNodes();
    }
}
