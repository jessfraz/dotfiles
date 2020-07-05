<?php
declare(strict_types = 1);

namespace LanguageServer\Tests\Utils;

use PHPUnit\Framework\TestCase;
use InvalidArgumentException;
use function LanguageServer\{pathToUri, uriToPath};

class FileUriTest extends TestCase
{
    public function testPathToUri()
    {
        $uri = pathToUri('var/log');
        $this->assertEquals('file:///var/log', $uri);

        $uri = pathToUri('/usr/local/bin');
        $this->assertEquals('file:///usr/local/bin', $uri);

        $uri = pathToUri('a/b/c/test.txt');
        $this->assertEquals('file:///a/b/c/test.txt', $uri);

        $uri = pathToUri('/d/e/f');
        $this->assertEquals('file:///d/e/f', $uri);

        // special chars are escaped
        $uri = pathToUri('c:/path/to/file/dürüm döner.php');
        $this->assertEquals('file:///c:/path/to/file/d%C3%BCr%C3%BCm%20d%C3%B6ner.php', $uri);

        //backslashes are transformed
        $uri = pathToUri('c:\\foo\\bar.baz');
        $this->assertEquals('file:///c:/foo/bar.baz', $uri);
    }

    public function testUriToPath()
    {
        $uri = 'file:///var/log';
        $this->assertEquals('/var/log', uriToPath($uri));

        $uri = 'file:///usr/local/bin';
        $this->assertEquals('/usr/local/bin', uriToPath($uri));

        $uri = 'file:///a/b/c/test.txt';
        $this->assertEquals('/a/b/c/test.txt', uriToPath($uri));

        $uri = 'file:///d/e/f';
        $this->assertEquals('/d/e/f', uriToPath($uri));

        $uri = 'file:///c:/path/to/file/d%C3%BCr%C3%BCm+d%C3%B6ner.php';
        $this->assertEquals('c:\\path\\to\\file\\dürüm döner.php', uriToPath($uri));

        $uri = 'file:///c:/foo/bar.baz';
        $this->assertEquals('c:\\foo\\bar.baz', uriToPath($uri));

        $uri = 'file:///c%3A/path/to/file/d%C3%BCr%C3%BCm+d%C3%B6ner.php';
        $this->assertEquals('c:\\path\\to\\file\\dürüm döner.php', uriToPath($uri));

        $uri = 'file:///c%3A/foo/bar.baz';
        $this->assertEquals('c:\\foo\\bar.baz', uriToPath($uri));
    }

    public function testUriToPathForUnknownProtocol()
    {
        $this->expectException(InvalidArgumentException::class);
        $uri = 'vfs:///whatever';
        uriToPath($uri);
    }

    public function testUriToPathForInvalidProtocol()
    {
        $this->expectException(InvalidArgumentException::class);
        $uri = 'http://www.google.com';
        uriToPath($uri);
    }
}
