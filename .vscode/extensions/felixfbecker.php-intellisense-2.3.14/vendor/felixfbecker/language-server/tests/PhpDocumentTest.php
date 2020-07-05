<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server;

use LanguageServer\{
    PhpDocument, DefinitionResolver
};
use LanguageServer\Index\{
    Index
};
use LanguageServerProtocol\{
    Position
};
use Microsoft\PhpParser;
use Microsoft\PhpParser\Node;
use phpDocumentor\Reflection\DocBlockFactory;
use PHPUnit\Framework\TestCase;
use function LanguageServer\isVendored;

class PhpDocumentTest extends TestCase
{
    public function createDocument(string $uri, string $content)
    {
        $parser = new PhpParser\Parser();
        $docBlockFactory = DocBlockFactory::createInstance();
        $index = new Index;
        $definitionResolver = new DefinitionResolver($index);
        return new PhpDocument($uri, $content, $index, $parser, $docBlockFactory, $definitionResolver);
    }

    public function testParsesVariableVariables()
    {
        $document = $this->createDocument('whatever', "<?php\n$\$a = 'foo';\n\$bar = 'baz';\n");

        $this->assertEquals([], $document->getDefinitions());
    }

    public function testGetNodeAtPosition()
    {
        $document = $this->createDocument('whatever', "<?php\n$\$a = new SomeClass;");
        $node = $document->getNodeAtPosition(new Position(1, 13));
        $this->assertQualifiedName($node);
        $this->assertEquals('SomeClass', (string)$node);
    }

    private function assertQualifiedName($node)
    {
        $this->assertInstanceOf(Node\QualifiedName::class, $node);
    }

    public function testIsVendored()
    {
        $document = $this->createDocument('file:///dir/vendor/x.php', "<?php\n$\$a = new SomeClass;");
        $this->assertEquals(true, isVendored($document));

        $document = $this->createDocument('file:///c:/dir/vendor/x.php', "<?php\n$\$a = new SomeClass;");
        $this->assertEquals(true, isVendored($document));

        $document = $this->createDocument('file:///vendor/x.php', "<?php\n$\$a = new SomeClass;");
        $this->assertEquals(true, isVendored($document));

        $document = $this->createDocument('file:///dir/vendor.php', "<?php\n$\$a = new SomeClass;");
        $this->assertEquals(false, isVendored($document));

        $document = $this->createDocument('file:///dir/x.php', "<?php\n$\$a = new SomeClass;");
        $this->assertEquals(false, isVendored($document));
    }
}
