<?php
declare(strict_types = 1);

namespace LanguageServer\Index;

use LanguageServer\Definition;
use Sabre\Event\EmitterTrait;

/**
 * Represents the index of a project or dependency
 * Serializable for caching
 */
class Index implements ReadableIndex, \Serializable
{
    use EmitterTrait;

    /**
     * An associative array that maps splitted fully qualified symbol names
     * to definitions, eg :
     * [
     *     'Psr' => [
     *         '\Log' => [
     *             '\LoggerInterface' => [
     *                 ''        => $def1, // definition for 'Psr\Log\LoggerInterface' which is non-member
     *                 '->log()' => $def2, // definition for 'Psr\Log\LoggerInterface->log()' which is a member
     *             ],
     *         ],
     *     ],
     * ]
     *
     * @var array
     */
    private $definitions = [];

    /**
     * An associative array that maps fully qualified symbol names
     * to arrays of document URIs that reference the symbol
     *
     * @var string[][]
     */
    private $references = [];

    /**
     * @var bool
     */
    private $complete = false;

    /**
     * @var bool
     */
    private $staticComplete = false;

    /**
     * Marks this index as complete
     *
     * @return void
     */
    public function setComplete()
    {
        if (!$this->isStaticComplete()) {
            $this->setStaticComplete();
        }
        $this->complete = true;
        $this->emit('complete');
    }

    /**
     * Marks this index as complete for static definitions and references
     *
     * @return void
     */
    public function setStaticComplete()
    {
        $this->staticComplete = true;
        $this->emit('static-complete');
    }

    /**
     * Returns true if this index is complete
     *
     * @return bool
     */
    public function isComplete(): bool
    {
        return $this->complete;
    }

    /**
     * Returns true if this index is complete
     *
     * @return bool
     */
    public function isStaticComplete(): bool
    {
        return $this->staticComplete;
    }

    /**
     * Returns a Generator providing an associative array [string => Definition]
     * that maps fully qualified symbol names to Definitions (global or not)
     *
     * @return \Generator yields Definition
     */
    public function getDefinitions(): \Generator
    {
        yield from $this->yieldDefinitionsRecursively($this->definitions);
    }

    /**
     * Returns a Generator that yields all the direct child Definitions of a given FQN
     *
     * @param string $fqn
     * @return \Generator yields Definition
     */
    public function getChildDefinitionsForFqn(string $fqn): \Generator
    {
        $parts = $this->splitFqn($fqn);
        if ('' === end($parts)) {
            // we want to return all the definitions in the given FQN, not only
            // the one (non member) matching exactly the FQN.
            array_pop($parts);
        }

        $result = $this->getIndexValue($parts, $this->definitions);
        if (!$result) {
            return;
        }
        foreach ($result as $name => $item) {
            // Don't yield the parent
            if ($name === '') {
                continue;
            }
            if ($item instanceof Definition) {
                yield $fqn.$name => $item;
            } elseif (is_array($item) && isset($item[''])) {
                yield $fqn.$name => $item[''];
            }
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
        $parts = $this->splitFqn($fqn);
        $result = $this->getIndexValue($parts, $this->definitions);

        if ($result instanceof Definition) {
            return $result;
        }

        if ($globalFallback) {
            $parts = explode('\\', $fqn);
            $fqn = end($parts);

            return $this->getDefinition($fqn);
        }
    }

    /**
     * Registers a definition
     *
     * @param string $fqn The fully qualified name of the symbol
     * @param Definition $definition The Definition object
     * @return void
     */
    public function setDefinition(string $fqn, Definition $definition)
    {
        $parts = $this->splitFqn($fqn);
        $this->indexDefinition(0, $parts, $this->definitions, $definition);

        $this->emit('definition-added');
    }

    /**
     * Unsets the Definition for a specific symbol
     * and removes all references pointing to that symbol
     *
     * @param string $fqn The fully qualified name of the symbol
     * @return void
     */
    public function removeDefinition(string $fqn)
    {
        $parts = $this->splitFqn($fqn);
        $this->removeIndexedDefinition(0, $parts, $this->definitions, $this->definitions);

        unset($this->references[$fqn]);
    }

    /**
     * Returns a Generator providing all URIs in this index that reference a symbol
     *
     * @param string $fqn The fully qualified name of the symbol
     * @return \Generator yields string
     */
    public function getReferenceUris(string $fqn): \Generator
    {
        foreach ($this->references[$fqn] ?? [] as $uri) {
            yield $uri;
        }
    }

    /**
     * For test use.
     * Returns all references, keyed by fqn.
     *
     * @return string[][]
     */
    public function getReferences(): array
    {
        return $this->references;
    }

    /**
     * Adds a document URI as a referencee of a specific symbol
     *
     * @param string $fqn The fully qualified name of the symbol
     * @return void
     */
    public function addReferenceUri(string $fqn, string $uri)
    {
        if (!isset($this->references[$fqn])) {
            $this->references[$fqn] = [];
        }
        // TODO: use DS\Set instead of searching array
        if (array_search($uri, $this->references[$fqn], true) === false) {
            $this->references[$fqn][] = $uri;
        }
    }

    /**
     * Removes a document URI as the container for a specific symbol
     *
     * @param string $fqn The fully qualified name of the symbol
     * @param string $uri The URI
     * @return void
     */
    public function removeReferenceUri(string $fqn, string $uri)
    {
        if (!isset($this->references[$fqn])) {
            return;
        }
        $index = array_search($fqn, $this->references[$fqn], true);
        if ($index === false) {
            return;
        }
        array_splice($this->references[$fqn], $index, 1);
    }

    /**
     * @param string $serialized
     * @return void
     */
    public function unserialize($serialized)
    {
        $data = unserialize($serialized);

        if (isset($data['definitions'])) {
            foreach ($data['definitions'] as $fqn => $definition) {
                $this->setDefinition($fqn, $definition);
            }

            unset($data['definitions']);
        }

        foreach ($data as $prop => $val) {
            $this->$prop = $val;
        }
    }

    /**
     * @return string
     */
    public function serialize()
    {
        return serialize([
            'definitions' => iterator_to_array($this->getDefinitions()),
            'references' => $this->references,
            'complete' => $this->complete,
            'staticComplete' => $this->staticComplete
        ]);
    }

    /**
     * Returns a Generator that yields all the Definitions in the given $storage recursively.
     * The generator yields key => value pairs, e.g.
     * `'Psr\Log\LoggerInterface->log()' => $definition`
     *
     * @param array &$storage
     * @param string $prefix (optional)
     * @return \Generator
     */
    private function yieldDefinitionsRecursively(array &$storage, string $prefix = ''): \Generator
    {
        foreach ($storage as $key => $value) {
            if (!is_array($value)) {
                yield $prefix.$key => $value;
            } else {
                yield from $this->yieldDefinitionsRecursively($value, $prefix.$key);
            }
        }
    }

    /**
     * Splits the given FQN into an array, eg :
     * - `'Psr\Log\LoggerInterface->log'` will be `['Psr', '\Log', '\LoggerInterface', '->log()']`
     * - `'\Exception->getMessage()'`     will be `['\Exception', '->getMessage()']`
     * - `'PHP_VERSION'`                  will be `['PHP_VERSION']`
     *
     * @param string $fqn
     * @return string[]
     */
    private function splitFqn(string $fqn): array
    {
        // split fqn at backslashes
        $parts = explode('\\', $fqn);

        // write back the backslash prefix to the first part if it was present
        if ('' === $parts[0] && count($parts) > 1) {
            $parts = array_slice($parts, 1);
            $parts[0] = '\\' . $parts[0];
        }

        // write back the backslashes prefixes for the other parts
        for ($i = 1; $i < count($parts); $i++) {
            $parts[$i] = '\\' . $parts[$i];
        }

        // split the last part in 2 parts at the operator
        $hasOperator = false;
        $lastPart = end($parts);
        foreach (['::', '->'] as $operator) {
            $endParts = explode($operator, $lastPart);
            if (count($endParts) > 1) {
                $hasOperator = true;
                // replace the last part by its pieces
                array_pop($parts);
                $parts[] = $endParts[0];
                $parts[] = $operator . $endParts[1];
                break;
            }
        }

        // The end($parts) === '' holds for the root namespace.
        if (!$hasOperator && end($parts) !== '') {
            // add an empty part to store the non-member definition to avoid
            // definition collisions in the index array, eg
            // 'Psr\Log\LoggerInterface' will be stored at
            // ['Psr']['\Log']['\LoggerInterface'][''] to be able to also store
            // member definitions, ie 'Psr\Log\LoggerInterface->log()' will be
            // stored at ['Psr']['\Log']['\LoggerInterface']['->log()']
            $parts[] = '';
        }

        return $parts;
    }

    /**
     * Return the values stored in this index under the given $parts array.
     * It can be an index node or a Definition if the $parts are precise
     * enough. Returns null when nothing is found.
     *
     * @param string[] $path              The splitted FQN
     * @param array|Definition &$storage  The current level to look for $path.
     * @return array|Definition|null
     */
    private function getIndexValue(array $path, &$storage)
    {
        // Empty path returns the object itself.
        if (empty($path)) {
            return $storage;
        }

        $part = array_shift($path);

        if (!isset($storage[$part])) {
            return null;
        }

        return $this->getIndexValue($path, $storage[$part]);
    }

    /**
     * Recursive function that stores the given Definition in the given $storage array represented
     * as a tree matching the given $parts.
     *
     * @param int $level              The current level of FQN part
     * @param string[] $parts         The splitted FQN
     * @param array &$storage         The array in which to store the $definition
     * @param Definition $definition  The Definition to store
     */
    private function indexDefinition(int $level, array $parts, array &$storage, Definition $definition)
    {
        $part = $parts[$level];

        if ($level + 1 === count($parts)) {
            $storage[$part] = $definition;

            return;
        }

        if (!isset($storage[$part])) {
            $storage[$part] = [];
        }

        $this->indexDefinition($level + 1, $parts, $storage[$part], $definition);
    }

    /**
     * Recursive function that removes the definition matching the given $parts from the given
     * $storage array. The function also looks up recursively to remove the parents of the
     * definition which no longer has children to avoid to let empty arrays in the index.
     *
     * @param int $level              The current level of FQN part
     * @param string[] $parts         The splitted FQN
     * @param array &$storage         The current array in which to remove data
     * @param array &$rootStorage     The root storage array
     */
    private function removeIndexedDefinition(int $level, array $parts, array &$storage, array &$rootStorage)
    {
        $part = $parts[$level];

        if ($level + 1 === count($parts)) {
            if (isset($storage[$part])) {
                unset($storage[$part]);

                if (0 === count($storage)) {
                    // parse again the definition tree to remove the parent
                    // when it has no more children
                    $this->removeIndexedDefinition(0, array_slice($parts, 0, $level), $rootStorage, $rootStorage);
                }
            }
        } else {
            $this->removeIndexedDefinition($level + 1, $parts, $storage[$part], $rootStorage);
        }
    }
}
