<?php

namespace MyNamespace;

class A {
    static function a() {
        $b = new a;
        $c = $b->a();
    }
}
