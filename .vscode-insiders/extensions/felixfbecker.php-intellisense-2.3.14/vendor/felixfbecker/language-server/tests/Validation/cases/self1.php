<?php

namespace MyNamespace;

class B {
    function b() {

    }
}

class A extends B {
    function a () {
        // TODO - should 'self' be included in references?
        $a = self::b();
    }
}
