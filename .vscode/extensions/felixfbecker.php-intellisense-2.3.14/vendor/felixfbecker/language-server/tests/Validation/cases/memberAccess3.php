<?php

namespace MyNamespace;

class A {
    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixesPsr0 = ComposerStaticInitIncludePath::$prefixesPsr0;

        }, null, ClassLoader::class);
    }
}
