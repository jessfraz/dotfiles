<?php

class ForLoopReference1 {
    public function getThat() {
        for ($that = $this; null !== $that; $that = $that->foo()) {
        }
    }

    public function foo() {
        return $this;
    }
}
