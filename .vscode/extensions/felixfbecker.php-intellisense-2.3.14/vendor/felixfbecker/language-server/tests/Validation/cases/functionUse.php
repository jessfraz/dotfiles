<?php

$a = new A;

$b = function () use ($a) {
    echo $a->b();
};