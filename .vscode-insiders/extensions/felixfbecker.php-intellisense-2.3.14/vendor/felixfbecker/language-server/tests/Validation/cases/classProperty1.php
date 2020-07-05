<?php

namespace TestNamespace;

use SomeNamespace\Goo;

class TestClass
{
    public $testProperty;

    public function testMethod($testParameter)
    {
        $testVariable = 123;

        if (empty($testParameter)) {
            echo 'Empty';
        }
    }
}
