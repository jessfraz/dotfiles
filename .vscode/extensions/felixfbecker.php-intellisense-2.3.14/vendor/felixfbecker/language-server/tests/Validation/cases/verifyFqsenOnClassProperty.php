<?php

class Foo {
    protected $bar = CURLAUTH_BASIC;

    public function foo () {
        $this->bar = 'hello';
    }
}
