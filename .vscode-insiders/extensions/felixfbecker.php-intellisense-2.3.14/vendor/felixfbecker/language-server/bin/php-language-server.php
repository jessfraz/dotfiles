<?php

use LanguageServer\{LanguageServer, ProtocolStreamReader, ProtocolStreamWriter, StderrLogger};
use Sabre\Event\Loop;
use Composer\XdebugHandler\XdebugHandler;

$options = getopt('', ['tcp::', 'tcp-server::', 'memory-limit::']);

ini_set('memory_limit', $options['memory-limit'] ?? '4G');

foreach ([__DIR__ . '/../../../autoload.php', __DIR__ . '/../autoload.php', __DIR__ . '/../vendor/autoload.php'] as $file) {
    if (file_exists($file)) {
        require $file;
        break;
    }
}

// Convert all errors to ErrorExceptions
set_error_handler(function (int $severity, string $message, string $file, int $line) {
    if (!(error_reporting() & $severity)) {
        // This error code is not included in error_reporting (can also be caused by the @ operator)
        return;
    }
    throw new \ErrorException($message, 0, $severity, $file, $line);
});

$logger = new StderrLogger();

// Only write uncaught exceptions to STDERR, not STDOUT
set_exception_handler(function (\Throwable $e) use ($logger) {
    $logger->critical((string)$e);
});

@cli_set_process_title('PHP Language Server');

// If XDebug is enabled, restart without it
$xdebugHandler = new XdebugHandler('PHPLS');
$xdebugHandler->setLogger($logger);
$xdebugHandler->check();
unset($xdebugHandler);

if (!empty($options['tcp'])) {
    // Connect to a TCP server
    $address = $options['tcp'];
    $socket = stream_socket_client('tcp://' . $address, $errno, $errstr);
    if ($socket === false) {
        $logger->critical("Could not connect to language client. Error $errno\n$errstr");
        exit(1);
    }
    stream_set_blocking($socket, false);
    $ls = new LanguageServer(
        new ProtocolStreamReader($socket),
        new ProtocolStreamWriter($socket)
    );
    Loop\run();
} else if (!empty($options['tcp-server'])) {
    // Run a TCP Server
    $address = $options['tcp-server'];
    $tcpServer = stream_socket_server('tcp://' . $address, $errno, $errstr);
    if ($tcpServer === false) {
        $logger->critical("Could not listen on $address. Error $errno\n$errstr");
        exit(1);
    }
    $logger->debug("Server listening on $address");
    $pcntlAvailable = extension_loaded('pcntl');
    if (!$pcntlAvailable) {
        $logger->notice('PCNTL is not available. Only a single connection will be accepted');
    }
    while ($socket = stream_socket_accept($tcpServer, -1)) {
        $logger->debug('Connection accepted');
        stream_set_blocking($socket, false);
        if ($pcntlAvailable) {
            // If PCNTL is available, fork a child process for the connection
            // An exit notification will only terminate the child process
            $pid = pcntl_fork();
            if ($pid === -1) {
                $logger->critical('Could not fork');
                exit(1);
            } else if ($pid === 0) {
                // Child process
                $reader = new ProtocolStreamReader($socket);
                $writer = new ProtocolStreamWriter($socket);
                $reader->on('close', function () use ($logger) {
                    $logger->debug('Connection closed');
                });
                $ls = new LanguageServer($reader, $writer);
                Loop\run();
                // Just for safety
                exit(0);
            }
        } else {
            // If PCNTL is not available, we only accept one connection.
            // An exit notification will terminate the server
            $ls = new LanguageServer(
                new ProtocolStreamReader($socket),
                new ProtocolStreamWriter($socket)
            );
            Loop\run();
        }
    }
} else {
    // Use STDIO
    $logger->debug('Listening on STDIN');
    stream_set_blocking(STDIN, false);
    $ls = new LanguageServer(
        new ProtocolStreamReader(STDIN),
        new ProtocolStreamWriter(STDOUT)
    );
    Loop\run();
}
