<?php
declare(strict_types = 1);

namespace LanguageServer\Client;

use LanguageServer\ClientHandler;
use Sabre\Event\Promise;

/**
 * Provides method handlers for all window/* methods
 */
class Window
{
    /**
     * @var ClientHandler
     */
    private $handler;

    public function __construct(ClientHandler $handler)
    {
        $this->handler = $handler;
    }

    /**
     * The show message notification is sent from a server to a client
     * to ask the client to display a particular message in the user interface.
     *
     * @param int $type
     * @param string $message
     * @return Promise <void>
     */
    public function showMessage(int $type, string $message): Promise
    {
        return $this->handler->notify('window/showMessage', ['type' => $type, 'message' => $message]);
    }

    /**
     * The log message notification is sent from the server to the client to ask the client to log a particular message.
     *
     * @param int $type
     * @param string $message
     * @return Promise <void>
     */
    public function logMessage(int $type, string $message): Promise
    {
        return $this->handler->notify('window/logMessage', ['type' => $type, 'message' => $message]);
    }
}
