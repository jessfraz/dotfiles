<?php
declare(strict_types = 1);

namespace LanguageServer\Index;

/**
 * Aggregates definitions of the project and stubs
 */
class GlobalIndex extends AbstractAggregateIndex
{
    /**
     * @var Index
     */
    private $stubsIndex;

    /**
     * @var ProjectIndex
     */
    private $projectIndex;

    /**
     * @param StubsIndex   $stubsIndex
     * @param ProjectIndex $projectIndex
     */
    public function __construct(StubsIndex $stubsIndex, ProjectIndex $projectIndex)
    {
        $this->stubsIndex = $stubsIndex;
        $this->projectIndex = $projectIndex;
        parent::__construct();
    }

    /**
     * @return ReadableIndex[]
     */
    protected function getIndexes(): array
    {
        return [$this->stubsIndex, $this->projectIndex];
    }
}
