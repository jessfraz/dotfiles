<?php

namespace MyNamespace;

class A
{
    public static function suite()
    {
        $suite = new self('Database related tests');
        $suite->addTestFile(__DIR__ . DS . 'Database' . DS . 'ConnectionTest.php');

    }
}