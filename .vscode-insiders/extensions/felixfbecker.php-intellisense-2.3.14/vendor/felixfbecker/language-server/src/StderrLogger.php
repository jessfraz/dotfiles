<?php
declare(strict_types = 1);

namespace LanguageServer;

/**
 * Simple Logger that logs to STDERR
 */
class StderrLogger extends \Psr\Log\AbstractLogger implements \Psr\Log\LoggerInterface
{
    /**
     * Logs with an arbitrary level.
     *
     * @param mixed  $level
     * @param string $message
     * @param array  $context
     *
     * @return void
     */
    public function log($level, $message, array $context = array())
    {
        $contextStr = empty($context) ? '' : ' ' . \json_encode($context, \JSON_UNESCAPED_SLASHES);
        \fwrite(\STDERR, \str_pad(\strtoupper((string)$level), 10) . $message . $contextStr . \PHP_EOL);
    }
}
