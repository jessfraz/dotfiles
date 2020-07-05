<?php
declare(strict_types = 1);

namespace LanguageServer\Index;

use LanguageServer\Definition;
use Sabre\Event\EmitterTrait;

abstract class AbstractAggregateIndex implements ReadableIndex
{
    use EmitterTrait;

    /**
     * Returns all indexes managed by the aggregate index
     *
     * @return ReadableIndex[]
     */
    abstract protected function getIndexes(): array;

    public function __construct()
    {
        foreach ($this->getIndexes() as $index) {
            $this->registerIndex($index);
        }
    }

    /**
     * @param ReadableIndex $index
     */
    protected function registerIndex(ReadableIndex $index)
    {
        $index->on('complete', function () {
            if ($this->isComplete()) {
                $this->emit('complete');
            }
        });
        $index->on('static-complete', function () {
            if ($this->isStaticComplete()) {
                $this->emit('static-complete');
            }
        });
        $index->on('definition-added', function () {
            $this->emit('definition-added');
        });
    }

    /**
     * Marks this index as complete
     *
     * @return void
     */
    public function setComplete()
    {
        foreach ($this->getIndexes() as $index) {
            $index->setComplete();
        }
    }

    /**
     * Marks this index as complete for static definitions and references
     *
     * @return void
     */
    public function setStaticComplete()
    {
        foreach ($this->getIndexes() as $index) {
            $index->setStaticComplete();
        }
    }

    /**
     * Returns true if this index is complete
     *
     * @return bool
     */
    public function isComplete(): bool
    {
        foreach ($this->getIndexes() as $index) {
            if (!$index->isComplete()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns true if this index is complete for static definitions or references
     *
     * @return bool
     */
    public function isStaticComplete(): bool
    {
        foreach ($this->getIndexes() as $index) {
            if (!$index->isStaticComplete()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns a Generator providing an associative array [string => Definition]
     * that maps fully qualified symbol names to Definitions (global or not)
     *
     * @return \Generator yields Definition
     */
    public function getDefinitions(): \Generator
    {
        foreach ($this->getIndexes() as $index) {
            yield from $index->getDefinitions();
        }
    }

    /**
     * Returns a Generator that yields all the direct child Definitions of a given FQN
     *
     * @param string $fqn
     * @return \Generator yields Definition
     */
    public function getChildDefinitionsForFqn(string $fqn): \Generator
    {
        foreach ($this->getIndexes() as $index) {
            yield from $index->getChildDefinitionsForFqn($fqn);
        }
    }

    /**
     * Returns the Definition object by a specific FQN
     *
     * @param string $fqn
     * @param bool $globalFallback Whether to fallback to global if the namespaced FQN was not found
     * @return Definition|null
     */
    public function getDefinition(string $fqn, bool $globalFallback = false)
    {
        foreach ($this->getIndexes() as $index) {
            if ($def = $index->getDefinition($fqn, $globalFallback)) {
                return $def;
            }
        }
    }

    /**
     * Returns a Generator providing all URIs in this index that reference a symbol
     *
     * @param string $fqn The fully qualified name of the symbol
     * @return \Generator yields string
     */
    public function getReferenceUris(string $fqn): \Generator
    {
        foreach ($this->getIndexes() as $index) {
            yield from $index->getReferenceUris($fqn);
        }
    }
}
