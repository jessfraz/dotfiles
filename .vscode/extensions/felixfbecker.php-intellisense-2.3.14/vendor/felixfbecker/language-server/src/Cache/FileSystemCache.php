<?php
declare(strict_types = 1);

namespace LanguageServer\Cache;

use Sabre\Event\Promise;

/**
 * Caches content on the file system
 */
class FileSystemCache implements Cache
{
    /**
     * @var string
     */
    public $cacheDir;

    public function __construct()
    {
        if (strtoupper(substr(php_uname('s'), 0, 3)) === 'WIN') {
            $this->cacheDir = getenv('LOCALAPPDATA') . '\\PHP Language Server\\';
        } else if (getenv('XDG_CACHE_HOME')) {
            $this->cacheDir = getenv('XDG_CACHE_HOME') . '/phpls/';
        } else {
            $this->cacheDir = getenv('HOME') . '/.phpls/';
        }
    }

    /**
     * Gets a value from the cache
     *
     * @param string $key
     * @return Promise <mixed>
     */
    public function get(string $key): Promise
    {
        try {
            $file = $this->cacheDir . urlencode($key);
            if (!file_exists($file)) {
                return Promise\resolve(null);
            }
            return Promise\resolve(unserialize(file_get_contents($file)));
        } catch (\Exception $e) {
            return Promise\resolve(null);
        }
    }

    /**
     * Sets a value in the cache
     *
     * @param string $key
     * @param mixed  $value
     * @return Promise
     */
    public function set(string $key, $value): Promise
    {
        try {
            $file = $this->cacheDir . urlencode($key);
            if (!file_exists($this->cacheDir)) {
                mkdir($this->cacheDir);
            }
            file_put_contents($file, serialize($value));
        } finally {
            return Promise\resolve(null);
        }
    }
}
