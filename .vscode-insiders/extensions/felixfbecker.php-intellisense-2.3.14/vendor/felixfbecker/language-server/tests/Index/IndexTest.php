<?php

namespace LanguageServer\Tests;

use PHPUnit\Framework\TestCase;
use LanguageServer\Index\Index;
use LanguageServer\Definition;

class IndexTest extends TestCase
{
    public function testGetSetMethodDefinition()
    {
        $index = new Index;
        $index->setDefinition('SomeNamespace\SomeClass', new Definition);
        $methodDefinition = new Definition;
        $methodFqn = 'SomeNamespace\SomeClass->someMethod()';
        $index->setDefinition($methodFqn, $methodDefinition);
        $index->setDefinition('SomeNamespace\SomeClass->someProperty', new Definition);
        $this->assertSame($methodDefinition, $index->getDefinition($methodFqn));
    }

    public function testGetSetClassDefinition()
    {
        $index = new Index;
        $definition = new Definition;
        $fqn = 'SomeNamespace\SomeClass';
        $index->setDefinition($fqn, $definition);
        $this->assertSame($definition, $index->getDefinition($fqn));
    }
}
