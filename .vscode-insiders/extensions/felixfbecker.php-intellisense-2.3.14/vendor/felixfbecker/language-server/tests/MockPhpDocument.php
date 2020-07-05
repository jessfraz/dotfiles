<?php
declare(strict_types = 1);

namespace LanguageServer\Tests;

/**
 * A fake document for tests
 */
class MockPhpDocument
{
    /**
     * Returns fake uri
     *
     * @return string
     */
    public function getUri()
    {
        return 'file:///whatever';
    }
}
