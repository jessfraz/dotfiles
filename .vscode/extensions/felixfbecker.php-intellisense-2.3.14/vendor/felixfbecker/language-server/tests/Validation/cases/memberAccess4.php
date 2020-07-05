<?php

namespace MyNamespace;

class A {
    public function testRequest()
    {
        $request = Request::create((new Url('httpkernel_test.empty'))->toString());
    }
}
