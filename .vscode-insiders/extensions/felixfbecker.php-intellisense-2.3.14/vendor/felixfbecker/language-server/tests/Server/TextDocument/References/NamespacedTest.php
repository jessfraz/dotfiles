<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Server\TextDocument\References;

use LanguageServerProtocol\{TextDocumentIdentifier, Position, ReferenceContext, Location, Range};
use function LanguageServer\pathToUri;

class NamespacedTest extends GlobalTest
{
    protected function getReferenceLocations(string $fqn): array
    {
        return parent::getReferenceLocations('TestNamespace\\' . $fqn);
    }

    protected function getDefinitionLocation(string $fqn): Location
    {
        return parent::getDefinitionLocation('TestNamespace\\' . $fqn);
    }

    public function testReferencesForNamespaces()
    {
        // namespace TestNamespace;
        // Get references for TestNamespace
        $definition = parent::getDefinitionLocation('TestNamespace');
        $result = $this->textDocument->references(
            new ReferenceContext,
            new TextDocumentIdentifier($definition->uri),
            $definition->range->end
        )->wait();
        $this->assertEquals(parent::getReferenceLocations('TestNamespace'), $result);
    }
}
