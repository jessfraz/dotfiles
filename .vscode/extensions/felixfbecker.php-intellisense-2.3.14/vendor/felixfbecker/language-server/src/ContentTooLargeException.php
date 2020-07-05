<?php
declare(strict_types = 1);

namespace LanguageServer;

/**
 * Thrown when the document content is not parsed because it exceeds the size limit
 */
class ContentTooLargeException extends \Exception
{
    /**
     * The URI of the file that exceeded the limit
     *
     * @var string
     */
    public $uri;

    /**
     * The size of the file in bytes
     *
     * @var int
     */
    public $size;

    /**
     * The limit that was exceeded in bytes
     *
     * @var int
     */
    public $limit;

    /**
     * @param string     $uri      The URI of the file that exceeded the limit
     * @param int        $size     The size of the file in bytes
     * @param int        $limit    The limit that was exceeded in bytes
     * @param \Throwable $previous The previous exception used for the exception chaining.
     */
    public function __construct(string $uri, int $size, int $limit, \Throwable $previous = null)
    {
        $this->uri = $uri;
        $this->size = $size;
        $this->limit = $limit;
        parent::__construct("$uri exceeds size limit of $limit bytes ($size)", 0, $previous);
    }
}
