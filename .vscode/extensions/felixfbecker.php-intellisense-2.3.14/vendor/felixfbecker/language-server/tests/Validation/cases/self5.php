<?php

namespace MyNamespace;

class A
{
    public function typesProvider()
    {
        $self = $this;
        $self->assertTrue("HI");
    }
}