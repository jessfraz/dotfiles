<?php

class FooClass {
    public function foo(): FooClass {
        return $this;
    }

    /** @return self */
    public function bar() { }
}
