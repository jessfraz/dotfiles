<?php
declare(strict_types = 1);

namespace LanguageServer\FilesFinder;

use Webmozart\Glob\Iterator\GlobIterator;
use Sabre\Event\Promise;
use function Sabre\Event\coroutine;
use function LanguageServer\{pathToUri, timeout};

class FileSystemFilesFinder implements FilesFinder
{
    /**
     * Returns all files in the workspace that match a glob.
     * If the client does not support workspace/xfiles, it falls back to searching the file system directly.
     *
     * @param string $glob
     * @return Promise <string[]>
     */
    public function find(string $glob): Promise
    {
        return coroutine(function () use ($glob) {
            $uris = [];
            foreach (new GlobIterator($glob) as $path) {
                // Exclude any directories that also match the glob pattern
                if (!is_dir($path)) {
                    $uris[] = pathToUri($path);
                }

                yield timeout();
            }
            return $uris;
        });
    }
}
