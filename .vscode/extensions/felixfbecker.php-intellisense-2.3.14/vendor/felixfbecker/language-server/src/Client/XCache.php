<?php
declare(strict_types = 1);

namespace LanguageServer\Client;

use LanguageServer\ClientHandler;
use Sabre\Event\Promise;

/**
 * Provides method handlers for all xcache/* methods
 */
class XCache
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
     * @param string $key
     * @return Promise <mixed>
     */
    public function get(string $key): Promise
    {
        return $this->handler->request('xcache/get', ['key' => $key]);
    }

    /**
     * @param string $key
     * @param mixed  $value
     * @return Promise <mixed>
     */
    public function set(string $key, $value): Promise
    {
        return $this->handler->notify('xcache/set', ['key' => $key, 'value' => $value]);
    }
}
