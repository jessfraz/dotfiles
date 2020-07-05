<?php
declare(strict_types = 1);

namespace LanguageServer\Tests;

use PHPUnit\Framework\TestCase;
use LanguageServer\ClientHandler;
use LanguageServer\Message;
use AdvancedJsonRpc;
use Sabre\Event\Loop;

class ClientHandlerTest extends TestCase
{
    public function testRequest()
    {
        $reader = new MockProtocolStream;
        $writer = new MockProtocolStream;
        $handler = new ClientHandler($reader, $writer);
        $writer->once('message', function (Message $msg) use ($reader) {
            // Respond to request
            Loop\setTimeout(function () use ($reader, $msg) {
                $reader->write(new Message(new AdvancedJsonRpc\SuccessResponse($msg->body->id, 'pong')));
            }, 0);
        });
        $handler->request('testMethod', ['ping'])->then(function ($result) {
            $this->assertEquals('pong', $result);
        })->wait();
        // No event listeners
        $this->assertEquals([], $reader->listeners('message'));
        $this->assertEquals([], $writer->listeners('message'));
    }

    public function testNotify()
    {
        $reader = new MockProtocolStream;
        $writer = new MockProtocolStream;
        $handler = new ClientHandler($reader, $writer);
        $handler->notify('testMethod', ['ping'])->wait();
        // No event listeners
        $this->assertEquals([], $reader->listeners('message'));
        $this->assertEquals([], $writer->listeners('message'));
    }
}
