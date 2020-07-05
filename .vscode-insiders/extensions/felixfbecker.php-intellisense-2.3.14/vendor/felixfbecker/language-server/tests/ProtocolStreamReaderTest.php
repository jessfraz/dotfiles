<?php
declare(strict_types = 1);

namespace LanguageServer\Tests;

use PHPUnit\Framework\TestCase;
use LanguageServer\{LanguageServer, ProtocolStreamReader, ProtocolStreamWriter};
use LanguageServer\Message;
use AdvancedJsonRpc\{Request as RequestBody, Response as ResponseBody};
use Sabre\Event\Loop;

class ProtocolStreamReaderTest extends TestCase
{
    public function testParsingWorksAndListenerIsCalled()
    {
        $tmpfile = tempnam('', '');
        $writeHandle = fopen($tmpfile, 'w');
        $reader = new ProtocolStreamReader(fopen($tmpfile, 'r'));
        $msg = null;
        $reader->on('message', function (Message $message) use (&$msg) {
            $msg = $message;
        });
        $ret = fwrite($writeHandle, (string)new Message(new RequestBody(1, 'aMethod', ['arg' => 'Hello World'])));
        Loop\tick();
        $this->assertNotNull($msg);
        $this->assertInstanceOf(Message::class, $msg);
        $this->assertInstanceOf(RequestBody::class, $msg->body);
        $this->assertEquals(1, $msg->body->id);
        $this->assertEquals('aMethod', $msg->body->method);
        $this->assertEquals((object)['arg' => 'Hello World'], $msg->body->params);
    }
}
