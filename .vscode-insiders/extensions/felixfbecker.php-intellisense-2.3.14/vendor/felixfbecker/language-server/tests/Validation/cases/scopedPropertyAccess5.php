<?php

class TestClass implements TestInterface {
    /**
     * Lorem excepteur officia sit anim velit veniam enim.
     *
     * @var TestClass[]
     */
    public static $testProperty;
}

echo TestClass::$testProperty;
echo TestClass::$staticTestProperty[123]->testProperty;