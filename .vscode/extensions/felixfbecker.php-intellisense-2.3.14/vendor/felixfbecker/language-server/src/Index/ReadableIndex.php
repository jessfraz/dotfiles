<?php
declare(strict_types = 1);

namespace LanguageServer\Index;

use LanguageServer\Definition;
use Sabre\Event\EmitterInterface;

/**
 * The ReadableIndex interface provides methods to lookup definitions and references
 *
 * @event definition-added Emitted when a definition was added
 * @event static-complete  Emitted when definitions and static references are complete
 * @event complete         Emitted when the index is complete
 */
interface ReadableIndex extends EmitterInterface
{
    /**
     * Returns true if this index is complete
     *
     * @return bool
     */
    public function isComplete(): bool;

    /**
     * Returns true if definitions and static references are complete
     *
     * @return bool
     */
    public function isStaticComplete(): bool;

    /**
     * Returns a Generator providing an associative array [string => Definition]
     * that maps fully qualified symbol names to Definitions (global or not)
     *
     * @return \Generator yields Definition
     */
    public function getDefinitions(): \Generator;

    /**
     * Returns a Generator that yields all the direct child Definitions of a given FQN
     *
     * @param string $fqn
     * @return \Generator yields Definition
     */
    public function getChildDefinitionsForFqn(string $fqn): \Generator;

    /**
     * Returns the Definition object by a specific FQN
     *
     * @param string $fqn
     * @param bool $globalFallback Whether to fallback to global if the namespaced FQN was not found
     * @return Definition|null
     */
    public function getDefinition(string $fqn, bool $globalFallback = false);

    /**
     * Returns a Generator that yields all URIs in this index that reference a symbol
     *
     * @param string $fqn The fully qualified name of the symbol
     * @return \Generator yields string
     */
    public function getReferenceUris(string $fqn): \Generator;
}
