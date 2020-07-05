<?php
declare(strict_types = 1);

namespace LanguageServer\Tests;

use LanguageServer\{ProtocolReader, ProtocolWriter};
use LanguageServer\Message;
use Sabre\Event\{Loop, Emitter, Promise};

/**
 * A fake duplex protocol stream
 */
class MockProtocolStream extends Emitter implements ProtocolReader, ProtocolWriter
{
    /**
     * Sends a Message to the client
     *
     * @param Message $msg
     * @return void
     */
    public function write(Message $msg): Promise
    {
        Loop\nextTick(function () use ($msg) {
            $this->emit('message', [Message::parse((string)$msg)]);
        });
        return Promise\resolve(null);
    }
}
