<?php

namespace MyNamespace1;

class B {
    function b() {

    }
}

namespace MyNamespace2;

class A extends MyNamespace1\B {
    function a () {
        $a = $this->b();
    }
}