<?php

namespace MyNamespace;
class B {

}

class A {
    function a () {
        $a = (new B)->hi();
    }
}
