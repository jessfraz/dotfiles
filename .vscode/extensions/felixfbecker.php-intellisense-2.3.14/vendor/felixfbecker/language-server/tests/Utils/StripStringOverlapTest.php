<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Utils;

use PHPUnit\Framework\TestCase;
use function LanguageServer\stripStringOverlap;

class StripStringOverlapTest extends TestCase
{
    public function testNoCharOverlaps()
    {
        $this->assertEquals('<?php', stripStringOverlap('bla', '<?php'));
    }

    public function test1CharOverlaps()
    {
        $this->assertEquals('?php', stripStringOverlap('bla<', '<?php'));
    }

    public function test2CharsOverlap()
    {
        $this->assertEquals('php', stripStringOverlap('bla<?', '<?php'));
    }

    public function testEverythingOverlaps()
    {
        $this->assertEquals('', stripStringOverlap('bla<?php', '<?php'));
    }

    public function testEmptyA()
    {
        $this->assertEquals('<?php', stripStringOverlap('', '<?php'));
    }

    public function testEmptyB()
    {
        $this->assertEquals('', stripStringOverlap('bla', ''));
    }

    public function testBothEmpty()
    {
        $this->assertEquals('', stripStringOverlap('', ''));
    }
}
