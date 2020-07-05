<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server;

use PHPUnit\Framework\TestCase;
use LanguageServer\Tests\MockProtocolStream;
use LanguageServer\{
    Server, LanguageClient, PhpDocumentLoader, DefinitionResolver
};
use LanguageServer\Index\{ProjectIndex, DependenciesIndex, Index};
use LanguageServer\ContentRetriever\FileSystemContentRetriever;
use LanguageServerProtocol\{Position, Location, Range};
use function LanguageServer\pathToUri;

abstract class ServerTestCase extends TestCase
{
    /**
     * @var Server\TextDocument
     */
    protected $textDocument;

    /**
     * @var Server\Workspace
     */
    protected $workspace;

    /**
     * @var PhpDocumentLoader
     */
    protected $documentLoader;

    /**
     * Map from FQN to Location of definition
     *
     * @var Location[]
     */
    private $definitionLocations;

    /**
     * Map from FQN to array of reference Locations
     *
     * @var Location[][]
     */
    private $referenceLocations;

    public function setUp()
    {
        $sourceIndex       = new Index;
        $dependenciesIndex = new DependenciesIndex;
        $projectIndex      = new ProjectIndex($sourceIndex, $dependenciesIndex);
        $projectIndex->setComplete();

        $definitionResolver   = new DefinitionResolver($projectIndex);
        $client               = new LanguageClient(new MockProtocolStream, new MockProtocolStream);
        $this->documentLoader = new PhpDocumentLoader(new FileSystemContentRetriever, $projectIndex, $definitionResolver);
        $this->textDocument   = new Server\TextDocument($this->documentLoader, $definitionResolver, $client, $projectIndex);
        $this->workspace      = new Server\Workspace($client, $projectIndex, $dependenciesIndex, $sourceIndex, null, $this->documentLoader);

        $globalSymbolsUri    = pathToUri(realpath(__DIR__ . '/../../fixtures/global_symbols.php'));
        $globalReferencesUri = pathToUri(realpath(__DIR__ . '/../../fixtures/global_references.php'));
        $symbolsUri          = pathToUri(realpath(__DIR__ . '/../../fixtures/symbols.php'));
        $referencesUri       = pathToUri(realpath(__DIR__ . '/../../fixtures/references.php'));
        $useUri              = pathToUri(realpath(__DIR__ . '/../../fixtures/use.php'));

        $this->documentLoader->load($symbolsUri)->wait();
        $this->documentLoader->load($referencesUri)->wait();
        $this->documentLoader->load($globalSymbolsUri)->wait();
        $this->documentLoader->load($globalReferencesUri)->wait();
        $this->documentLoader->load($useUri)->wait();

        // @codingStandardsIgnoreStart
        $this->definitionLocations = [

            // Global
            'TEST_DEFINE_CONSTANT'                   => new Location($globalSymbolsUri,    new Range(new Position(104, 0), new Position(104, 37))),
            'TEST_CONST'                             => new Location($globalSymbolsUri,    new Range(new Position( 9,  6), new Position( 9,  22))),
            'TestClass'                              => new Location($globalSymbolsUri,    new Range(new Position(20,  0), new Position(61,   1))),
            'ChildClass'                             => new Location($globalSymbolsUri,    new Range(new Position(99,  0), new Position(99,  37))),
            'TestTrait'                              => new Location($globalSymbolsUri,    new Range(new Position(63,  0), new Position(66,   1))),
            'TestInterface'                          => new Location($globalSymbolsUri,    new Range(new Position(68,  0), new Position(71,   1))),
            'TestClass::TEST_CLASS_CONST'            => new Location($globalSymbolsUri,    new Range(new Position(27, 10), new Position(27,  32))),
            'TestClass::testProperty'                => new Location($globalSymbolsUri,    new Range(new Position(41, 11), new Position(41,  24))),
            'TestClass::staticTestProperty'          => new Location($globalSymbolsUri,    new Range(new Position(34, 18), new Position(34,  37))),
            'TestClass::staticTestMethod()'          => new Location($globalSymbolsUri,    new Range(new Position(46,  4), new Position(49,   5))),
            'TestClass::testMethod()'                => new Location($globalSymbolsUri,    new Range(new Position(57,  4), new Position(60,   5))),
            'test_function()'                        => new Location($globalSymbolsUri,    new Range(new Position(78,  0), new Position(81,   1))),
            'UnusedClass'                            => new Location($globalSymbolsUri,    new Range(new Position(111, 0), new Position(118,  1))),
            'UnusedClass::unusedProperty'            => new Location($globalSymbolsUri,    new Range(new Position(113,11), new Position(113, 26))),
            'UnusedClass::unusedMethod'              => new Location($globalSymbolsUri,    new Range(new Position(115, 4), new Position(117,  5))),
            'whatever()'                             => new Location($globalReferencesUri, new Range(new Position(21,  0), new Position(23,   1))),

            // Namespaced
            'TestNamespace'                                => new Location($symbolsUri,    new Range(new Position( 2, 0), new Position( 2, 24))),
            'SecondTestNamespace'                          => new Location($useUri,        new Range(new Position( 2, 0), new Position( 2, 30))),
            'TestNamespace\\TEST_CONST'                    => new Location($symbolsUri,    new Range(new Position( 9,  6), new Position( 9, 22))),
            'TestNamespace\\TestClass'                     => new Location($symbolsUri,    new Range(new Position(20,  0), new Position(61,  1))),
            'TestNamespace\\ChildClass'                    => new Location($symbolsUri,    new Range(new Position(99,  0), new Position(99, 37))),
            'TestNamespace\\TestTrait'                     => new Location($symbolsUri,    new Range(new Position(63,  0), new Position(66,  1))),
            'TestNamespace\\TestInterface'                 => new Location($symbolsUri,    new Range(new Position(68,  0), new Position(71,  1))),
            'TestNamespace\\TestClass::TEST_CLASS_CONST'   => new Location($symbolsUri,    new Range(new Position(27, 10), new Position(27,  32))),
            'TestNamespace\\TestClass::testProperty'       => new Location($symbolsUri,    new Range(new Position(41, 11), new Position(41,  24))),
            'TestNamespace\\TestClass::staticTestProperty' => new Location($symbolsUri,    new Range(new Position(34, 18), new Position(34,  37))),
            'TestNamespace\\TestClass::staticTestMethod()' => new Location($symbolsUri,    new Range(new Position(46,  4), new Position(49,   5))),
            'TestNamespace\\TestClass::testMethod()'       => new Location($symbolsUri,    new Range(new Position(57,  4), new Position(60,   5))),
            'TestNamespace\\test_function()'               => new Location($symbolsUri,    new Range(new Position(78,  0), new Position(81,   1))),
            'TestNamespace\\whatever()'                    => new Location($referencesUri, new Range(new Position(21,  0), new Position(23,   1))),
            'TestNamespace\\Example'                       => new Location($symbolsUri,    new Range(new Position(101, 0), new Position(104,  1))),
            'TestNamespace\\Example::__construct'          => new Location($symbolsUri,    new Range(new Position(102, 4), new Position(102, 36))),
            'TestNamespace\\Example::__destruct'           => new Location($symbolsUri,    new Range(new Position(103, 4), new Position(103, 35))),
            'TestNamespace\\InnerNamespace'                => new Location($symbolsUri,    new Range(new Position(106, 0), new Position(106, 39))),
            'TestNamespace\\InnerNamespace\\InnerClass'    => new Location($symbolsUri,    new Range(new Position(108, 0), new Position(109,  1))),
        ];

        $this->referenceLocations = [

            // Namespaced
            'TestNamespace' => [
                0 => new Location($referencesUri, new Range(new Position(31, 13), new Position(31, 40))), // use function TestNamespace\test_function;
                1 => new Location($useUri,        new Range(new Position( 4,  4), new Position( 4, 27))), // use TestNamespace\TestClass;
                2 => new Location($useUri,        new Range(new Position( 5,  4), new Position( 5, 18)))  // use TestNamespace\{TestTrait, TestInterface};
            ],
            'TestNamespace\\TEST_CONST' => [
                0 => new Location($referencesUri, new Range(new Position(29,  5), new Position(29, 15)))
            ],
            'TestNamespace\\TestClass' => [
                0 => new Location($symbolsUri,    new Range(new Position(48, 13), new Position(48, 17))), // echo self::TEST_CLASS_CONST;
                1 => new Location($symbolsUri   , new Range(new Position(99, 25), new Position(99, 34))), // class ChildClass extends TestClass {}
                2 => new Location($referencesUri, new Range(new Position( 4, 11), new Position( 4, 20))), // $obj = new TestClass();
                3 => new Location($referencesUri, new Range(new Position( 7,  0), new Position( 7,  9))), // TestClass::staticTestMethod();
                4 => new Location($referencesUri, new Range(new Position( 8,  5), new Position( 8, 14))), // echo TestClass::$staticTestProperty;
                5 => new Location($referencesUri, new Range(new Position( 9,  5), new Position( 9, 14))), // TestClass::TEST_CLASS_CONST;
                6 => new Location($referencesUri, new Range(new Position(21, 18), new Position(21, 27))), // function whatever(TestClass $param)
                7 => new Location($referencesUri, new Range(new Position(21, 37), new Position(21, 46))), // function whatever(TestClass $param): TestClass
                8 => new Location($referencesUri, new Range(new Position(39,  0), new Position(39,  9))), // TestClass::$staticTestProperty[123]->testProperty;
                9 => new Location($useUri,        new Range(new Position( 4,  4), new Position( 4, 27))), // use TestNamespace\TestClass;
            ],
            'TestNamespace\\TestChild' => [
                0 => new Location($referencesUri, new Range(new Position(42,  5), new Position(42, 25))), // echo $child->testProperty;
            ],
            'TestNamespace\\TestInterface' => [
                0 => new Location($symbolsUri,    new Range(new Position(20, 27), new Position(20, 40))), // class TestClass implements TestInterface
                1 => new Location($symbolsUri,    new Range(new Position(57, 48), new Position(57, 61))), // public function testMethod($testParameter): TestInterface
                2 => new Location($referencesUri, new Range(new Position(33, 20), new Position(33, 33)))  // if ($abc instanceof TestInterface)
            ],
            'TestNamespace\\TestClass::TEST_CLASS_CONST' => [
                0 => new Location($symbolsUri,    new Range(new Position(48, 13), new Position(48, 35))), // echo self::TEST_CLASS_CONSTANT
                1 => new Location($referencesUri, new Range(new Position( 9,  5), new Position( 9, 32)))
            ],
            'TestNamespace\\TestClass::testProperty' => [
                0 => new Location($symbolsUri,    new Range(new Position(59,  8), new Position(59, 27))), // $this->testProperty = $testParameter;
                1 => new Location($referencesUri, new Range(new Position( 6,  5), new Position( 6, 23))), // echo $obj->testProperty;
                2 => new Location($referencesUri, new Range(new Position(38,  0), new Position(38, 18))), // $obj->testProperty->testMethod();
                3 => new Location($referencesUri, new Range(new Position(39,  0), new Position(39, 49)))  // TestClass::$staticTestProperty[123]->testProperty;
            ],
            'TestNamespace\\TestClass::staticTestProperty' => [
                0 => new Location($referencesUri, new Range(new Position( 8,  16), new Position( 8, 35))), // echo TestClass::$staticTestProperty;
                1 => new Location($referencesUri, new Range(new Position(39,  11), new Position(39, 30)))  // TestClass::$staticTestProperty[123]->testProperty;
            ],
            'TestNamespace\\TestClass::staticTestMethod()' => [
                0 => new Location($referencesUri, new Range(new Position( 7,  0), new Position( 7, 27)))
            ],
            'TestNamespace\\TestClass::testMethod()' => [
                0 => new Location($referencesUri, new Range(new Position( 5,  0), new Position( 5, 16))), // $obj->testMethod();
                1 => new Location($referencesUri, new Range(new Position(38,  0), new Position(38, 30))), // $obj->testProperty->testMethod();
                2 => new Location($referencesUri, new Range(new Position(42,  5), new Position(42, 23)))  // $child->testMethod();
            ],
            'TestNamespace\\test_function()' => [
                0 => new Location($referencesUri, new Range(new Position(10,  0), new Position(10, 13))),
                1 => new Location($referencesUri, new Range(new Position(31, 13), new Position(31, 40)))
            ],

            // Global
            'TEST_DEFINE_CONSTANT' => [
                0 => new Location($globalSymbolsUri,    new Range(new Position(106, 6), new Position(106, 26)))
            ],
            'TEST_CONST' => [
                0 => new Location($referencesUri,       new Range(new Position(29,  5), new Position(29, 15))),
                1 => new Location($globalReferencesUri, new Range(new Position(29,  5), new Position(29, 15)))
            ],
            'TestClass' => [
                0 => new Location($globalSymbolsUri,    new Range(new Position(48, 13), new Position(48, 17))), // echo self::TEST_CLASS_CONST;
                1 => new Location($globalSymbolsUri,    new Range(new Position(99, 25), new Position(99, 34))), // class ChildClass extends TestClass {}
                2 => new Location($globalReferencesUri, new Range(new Position( 4, 11), new Position( 4, 20))), // $obj = new TestClass();
                3 => new Location($globalReferencesUri, new Range(new Position( 7,  0), new Position( 7,  9))), // TestClass::staticTestMethod();
                4 => new Location($globalReferencesUri, new Range(new Position( 8,  5), new Position( 8, 14))), // echo TestClass::$staticTestProperty;
                5 => new Location($globalReferencesUri, new Range(new Position( 9,  5), new Position( 9, 14))), // TestClass::TEST_CLASS_CONST;
                6 => new Location($globalReferencesUri, new Range(new Position(21, 18), new Position(21, 27))), // function whatever(TestClass $param)
                7 => new Location($globalReferencesUri, new Range(new Position(21, 37), new Position(21, 46))), // function whatever(TestClass $param): TestClass
                8 => new Location($globalReferencesUri, new Range(new Position(39,  0), new Position(39,  9))), // TestClass::$staticTestProperty[123]->testProperty;
            ],
            'TestChild' => [
                0 => new Location($globalReferencesUri, new Range(new Position(42,  5), new Position(42, 25))), // echo $child->testProperty;
            ],
            'TestInterface' => [
                0 => new Location($globalSymbolsUri,    new Range(new Position(20, 27), new Position(20, 40))), // class TestClass implements TestInterface
                1 => new Location($globalSymbolsUri,    new Range(new Position(57, 49), new Position(57, 61))), // public function testMethod($testParameter) : TestInterface
                2 => new Location($globalReferencesUri, new Range(new Position(33, 20), new Position(33, 33)))  // if ($abc instanceof TestInterface)
            ],
            'TestClass::TEST_CLASS_CONST' => [
                0 => new Location($globalSymbolsUri,    new Range(new Position(48, 13), new Position(48, 35))), // echo self::TEST_CLASS_CONSTANT
                1 => new Location($globalReferencesUri, new Range(new Position( 9,  5), new Position( 9, 32)))
            ],
            'TestClass::testProperty' => [
                0 => new Location($globalSymbolsUri,    new Range(new Position(59,  8), new Position(59, 27))), // $this->testProperty = $testParameter;
                1 => new Location($globalReferencesUri, new Range(new Position( 6,  5), new Position( 6, 23))), // echo $obj->testProperty;
                2 => new Location($globalReferencesUri, new Range(new Position(38,  0), new Position(38, 18))), // $obj->testProperty->testMethod();
                3 => new Location($globalReferencesUri, new Range(new Position(39,  0), new Position(39, 49)))  // TestClass::$staticTestProperty[123]->testProperty;
            ],
            'TestClass::staticTestProperty' => [
                0 => new Location($globalReferencesUri, new Range(new Position( 8,  16), new Position( 8, 35))), // echo TestClass::$staticTestProperty;
                1 => new Location($globalReferencesUri, new Range(new Position(39,  11), new Position(39, 30)))  // TestClass::$staticTestProperty[123]->testProperty;
            ],
            'TestClass::staticTestMethod()' => [
                0 => new Location($globalReferencesUri, new Range(new Position( 7,  0), new Position( 7, 27)))
            ],
            'TestClass::testMethod()' => [
                0 => new Location($globalReferencesUri, new Range(new Position( 5,  0), new Position( 5, 16))), // $obj->testMethod();
                1 => new Location($globalReferencesUri, new Range(new Position(38,  0), new Position(38, 30))), // $obj->testProperty->testMethod();
                2 => new Location($globalReferencesUri, new Range(new Position(42,  5), new Position(42, 23)))  // $child->testMethod();
            ],
            'test_function()' => [
                0 => new Location($globalReferencesUri, new Range(new Position(10,  0), new Position(10, 13))),
                1 => new Location($globalReferencesUri, new Range(new Position(31, 13), new Position(31, 40)))
            ]
        ];
        // @codingStandardsIgnoreEnd
    }

    protected function getDefinitionLocation(string $fqn): Location
    {
        return $this->definitionLocations[$fqn];
    }

    protected function getReferenceLocations(string $fqn): array
    {
        return $this->referenceLocations[$fqn];
    }
}
