<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server;

use LanguageServer\{
    PhpDocument, PhpDocumentLoader, Project, DefinitionResolver
};
use LanguageServer\ContentRetriever\FileSystemContentRetriever;
use LanguageServer\Index\{
    DependenciesIndex, Index, ProjectIndex
};
use PHPUnit\Framework\TestCase;
use function LanguageServer\pathToUri;

class PhpDocumentLoaderTest extends TestCase
{
    /**
     * @var PhpDocumentLoader
     */
    private $loader;

    public function setUp()
    {
        $projectIndex = new ProjectIndex(new Index, new DependenciesIndex);
        $this->loader = new PhpDocumentLoader(
            new FileSystemContentRetriever,
            $projectIndex,
            new DefinitionResolver($projectIndex)
        );
    }

    public function testGetOrLoadLoadsDocument()
    {
        $document = $this->loader->getOrLoad(pathToUri(__FILE__))->wait();

        $this->assertNotNull($document);
        $this->assertInstanceOf(PhpDocument::class, $document);
    }

    public function testGetReturnsOpenedInstance()
    {
        $document1 = $this->loader->open(pathToUri(__FILE__), file_get_contents(__FILE__));
        $document2 = $this->loader->get(pathToUri(__FILE__));

        $this->assertSame($document1, $document2);
    }
}
