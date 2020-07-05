<?php

class NewStatic {
    public static function main()
    {
        $command = new static;
        return $command->foo();
    }

    private function foo() {
    }
}