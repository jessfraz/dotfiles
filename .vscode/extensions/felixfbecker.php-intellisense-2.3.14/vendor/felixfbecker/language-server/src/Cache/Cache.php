<?php
declare(strict_types = 1);

namespace LanguageServer\Cache;

use Sabre\Event\Promise;

/**
 * A key/value store for caching purposes
 */
interface Cache
{
    /**
     * Gets a value from the cache
     *
     * @param string $key
     * @return Promise <mixed>
     */
    public function get(string $key): Promise;

    /**
     * Sets a value in the cache
     *
     * @param string $key
     * @param mixed  $value
     * @return Promise
     */
    public function set(string $key, $value): Promise;
}
