<?php

class FooClass {
    public static function staticFoo(): FooClass {
        return new FooClass();
    }

    public static function staticSelf(): self { }

    public function bar() { }
}
