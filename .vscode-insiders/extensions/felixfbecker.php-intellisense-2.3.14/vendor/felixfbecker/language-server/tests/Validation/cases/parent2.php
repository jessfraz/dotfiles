<?php

namespace MyNamespace;

class B {
    function b() {

    }
}

class A extends B {
    function a () {
        $a = PARENT::b();
    }
}
