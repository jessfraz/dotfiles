<?php

namespace LanguageServer\Tests;
require __DIR__ . '/../vendor/autoload.php';

use Composer\XdebugHandler\XdebugHandler;
use Exception;
use LanguageServer\CompletionProvider;
use LanguageServer\DefinitionResolver;
use LanguageServer\Index\Index;
use LanguageServer\PhpDocument;
use LanguageServer\StderrLogger;
use LanguageServerProtocol\Position;
use Microsoft\PhpParser;
use phpDocumentor\Reflection\DocBlockFactory;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

$logger = new StderrLogger();
$xdebugHandler = new XdebugHandler('PHPLS');
$xdebugHandler->setLogger($logger);
$xdebugHandler->check();
unset($xdebugHandler);

$totalSize = 0;

$framework = "symfony";

$iterator = new RecursiveDirectoryIterator(__DIR__ . "/../validation/frameworks/$framework");
$testProviderArray = array();

foreach (new RecursiveIteratorIterator($iterator) as $file) {
    if (strpos((string)$file, ".php") !== false) {
        $totalSize += $file->getSize();
        $testProviderArray[] = $file->getRealPath();
    }
}

if (count($testProviderArray) === 0) {
    throw new Exception("ERROR: Validation testsuite frameworks not found - run `git submodule update --init --recursive` to download.");
}

$index = new Index;
$definitionResolver = new DefinitionResolver($index);
$completionProvider = new CompletionProvider($definitionResolver, $index);
$docBlockFactory = DocBlockFactory::createInstance();
$completionFile = realpath(__DIR__ . '/../validation/frameworks/symfony/src/Symfony/Component/HttpFoundation/Request.php');
$parser = new PhpParser\Parser();
$completionDocument = null;

echo "Indexing $framework" . PHP_EOL;

foreach ($testProviderArray as $idx => $testCaseFile) {
    if (filesize($testCaseFile) > 100000) {
        continue;
    }
    if ($idx % 100 === 0) {
        echo $idx . '/' . count($testProviderArray) . PHP_EOL;
    }

    $fileContents = file_get_contents($testCaseFile);

    try {
        $d = new PhpDocument($testCaseFile, $fileContents, $index, $parser, $docBlockFactory, $definitionResolver);
        if ($testCaseFile === $completionFile) {
            $completionDocument = $d;
        }
    } catch (\Throwable $e) {
        echo $e->getMessage() . PHP_EOL;
        continue;
    }
}

echo "Getting completion". PHP_EOL;

// Completion in $this->|request = new ParameterBag($request);
$start = microtime(true);
$list = $completionProvider->provideCompletion($completionDocument, new Position(274, 15));
$end = microtime(true);
echo 'Time ($this->|): ' . ($end - $start) . 's' . PHP_EOL;
echo count($list->items) . ' completion items' . PHP_EOL;

// Completion in $this->request = new| ParameterBag($request);
// (this only finds ParameterBag though.)
$start = microtime(true);
$list = $completionProvider->provideCompletion($completionDocument, new Position(274, 28));
$end = microtime(true);
echo 'Time (new|): ' . ($end - $start) . 's' . PHP_EOL;
echo count($list->items) . ' completion items' . PHP_EOL;
