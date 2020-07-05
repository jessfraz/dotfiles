<?php

namespace LanguageServer\Tests;
require __DIR__ . '/../vendor/autoload.php';

use Composer\XdebugHandler\XdebugHandler;
use Exception;
use LanguageServer\DefinitionResolver;
use LanguageServer\Index\Index;
use LanguageServer\PhpDocument;
use LanguageServer\StderrLogger;
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

$frameworks = ["drupal", "wordpress", "php-language-server", "tolerant-php-parser", "math-php", "symfony", "codeigniter", "cakephp"];

foreach($frameworks as $framework) {
    $iterator = new RecursiveDirectoryIterator(__DIR__ . "/../validation/frameworks/$framework");
    $testProviderArray = array();

    foreach (new RecursiveIteratorIterator($iterator) as $file) {
        if (strpos((string)$file, ".php") !== false) {
            $totalSize += $file->getSize();
            $testProviderArray[] = $file->getPathname();
        }
    }

    if (count($testProviderArray) === 0) {
        throw new Exception("ERROR: Validation testsuite frameworks not found - run `git submodule update --init --recursive` to download.");
    }

    $start = microtime(true);

    foreach ($testProviderArray as $idx => $testCaseFile) {
        if (filesize($testCaseFile) > 10000) {
            continue;
        }
        if ($idx % 500 === 0) {
            echo $idx . '/' . count($testProviderArray) . PHP_EOL;
        }

        $fileContents = file_get_contents($testCaseFile);

        $docBlockFactory = DocBlockFactory::createInstance();
        $index = new Index;
        $maxRecursion = [];
        $definitions = [];

        $definitionResolver = new DefinitionResolver($index);
        $parser = new PhpParser\Parser();

        $document = new PhpDocument($testCaseFile, $fileContents, $index, $parser, $docBlockFactory, $definitionResolver);
    }

    echo "------------------------------\n";

    echo "Time [$framework]: " . (microtime(true) - $start) . PHP_EOL;
}

