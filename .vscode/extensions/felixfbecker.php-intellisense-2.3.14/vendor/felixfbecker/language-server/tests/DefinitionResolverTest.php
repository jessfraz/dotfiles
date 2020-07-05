<?php
declare(strict_types = 1);

namespace LanguageServer\Tests;

use PHPUnit\Framework\TestCase;
use LanguageServer\Index\Index;
use LanguageServer\DefinitionResolver;
use Microsoft\PhpParser;

class DefinitionResolverTest extends TestCase
{
    public function testCreateDefinitionFromNode()
    {
        $parser = new PhpParser\Parser;
        $doc = new MockPhpDocument;
        $sourceFileNode = $parser->parseSourceFile("<?php\ndefine('TEST_DEFINE', true);", $doc->getUri());

        $index = new Index;
        $definitionResolver = new DefinitionResolver($index);
        $def = $definitionResolver->createDefinitionFromNode($sourceFileNode->statementList[1]->expression, '\TEST_DEFINE');

        $this->assertInstanceOf(\phpDocumentor\Reflection\Types\Boolean::class, $def->type);
    }

    public function testGetTypeFromNode()
    {
        $parser = new PhpParser\Parser;
        $doc = new MockPhpDocument;
        $sourceFileNode = $parser->parseSourceFile("<?php\ndefine('TEST_DEFINE', true);", $doc->getUri());

        $index = new Index;
        $definitionResolver = new DefinitionResolver($index);
        $type = $definitionResolver->getTypeFromNode($sourceFileNode->statementList[1]->expression);

        $this->assertInstanceOf(\phpDocumentor\Reflection\Types\Boolean::class, $type);
    }

    public function testGetDefinedFqnForIncompleteDefine()
    {
        // define('XXX') (only one argument) must not introduce a new symbol
        $parser = new PhpParser\Parser;
        $doc = new MockPhpDocument;
        $sourceFileNode = $parser->parseSourceFile("<?php\ndefine('TEST_DEFINE');", $doc->getUri());

        $index = new Index;
        $definitionResolver = new DefinitionResolver($index);
        $fqn = $definitionResolver->getDefinedFqn($sourceFileNode->statementList[1]->expression);

        $this->assertNull($fqn);
    }

    public function testGetDefinedFqnForDefine()
    {
        $parser = new PhpParser\Parser;
        $doc = new MockPhpDocument;
        $sourceFileNode = $parser->parseSourceFile("<?php\ndefine('TEST_DEFINE', true);", $doc->getUri());

        $index = new Index;
        $definitionResolver = new DefinitionResolver($index);
        $fqn = $definitionResolver->getDefinedFqn($sourceFileNode->statementList[1]->expression);

        $this->assertEquals('TEST_DEFINE', $fqn);
    }
}
