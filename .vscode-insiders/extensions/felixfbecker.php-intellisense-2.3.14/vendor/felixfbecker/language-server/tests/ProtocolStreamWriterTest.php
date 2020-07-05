<?php
declare(strict_types = 1);

namespace LanguageServer\Tests;

use PHPUnit\Framework\TestCase;
use LanguageServer\ProtocolStreamWriter;
use LanguageServer\Message;
use AdvancedJsonRpc\{Request as RequestBody};
use Sabre\Event\Loop;

class ProtocolStreamWriterTest extends TestCase
{
    public function testLargeMessageIsSent()
    {
        $tmpfile = tempnam('', '');
        $writeHandle = fopen($tmpfile, 'w');

        stream_set_blocking($writeHandle, false);

        $writer = new ProtocolStreamWriter($writeHandle);
        $msg = new Message(new RequestBody(1, 'aMethod', ['arg' => str_repeat('X', 100000)]));
        $msgString = (string)$msg;

        $promise = $writer->write($msg);

        Loop\tick();

        $promise->wait();

        fclose($writeHandle);

        $this->assertEquals(strlen($msgString), filesize($tmpfile));
    }
}
