<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Diagnostics;

use PHPUnit\Framework\TestCase;
use phpDocumentor\Reflection\DocBlockFactory;
use LanguageServer\{
    DefinitionResolver, TreeAnalyzer
};
use LanguageServer\Index\{Index};
use LanguageServerProtocol\{
    Diagnostic, DiagnosticSeverity, Position, Range
};
use function LanguageServer\pathToUri;
use Microsoft\PhpParser\Parser;

class InvalidThisUsageTest extends TestCase
{
    /**
     * Parse the given file and return diagnostics.
     *
     * @param string $path
     * @return Diagnostic[]
     */
    private function collectDiagnostics(string $path): array
    {
        $uri = pathToUri($path);
        $parser = new Parser();

        $docBlockFactory = DocBlockFactory::createInstance();
        $index = new Index;
        $definitionResolver = new DefinitionResolver($index);
        $content = file_get_contents($path);

        $treeAnalyzer = new TreeAnalyzer($parser, $content, $docBlockFactory, $definitionResolver, $uri);
        return $treeAnalyzer->getDiagnostics();
    }

    /**
     * Assertions about a diagnostic.
     *
     * @param Diagnostic|null $diagnostic
     * @param int $message
     * @param string $severity
     * @param Range $range
     */
    private function assertDiagnostic($diagnostic, $message, $severity, $range)
    {
        $this->assertInstanceOf(Diagnostic::class, $diagnostic);
        $this->assertEquals($message, $diagnostic->message);
        $this->assertEquals($severity, $diagnostic->severity);
        $this->assertEquals($range, $diagnostic->range);
    }

    public function testThisInStaticMethodProducesError()
    {
        $diagnostics = $this->collectDiagnostics(
            __DIR__ . '/../../fixtures/diagnostics/errors/this_in_static_method.php'
        );

        $this->assertCount(1, $diagnostics);
        $this->assertDiagnostic(
            $diagnostics[0],
            '$this can not be used in static methods.',
            DiagnosticSeverity::ERROR,
            new Range(
                new Position(6, 15),
                new Position(6, 20)
            )
        );
    }

    public function testThisInMethodProducesNoError()
    {
        $diagnostics = $this->collectDiagnostics(
            __DIR__ . '/../../fixtures/diagnostics/baselines/this_in_method.php'
        );

        $this->assertCount(0, $diagnostics);
    }
}
