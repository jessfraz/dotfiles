<?php
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

namespace Microsoft\PhpParser\Node;

use Microsoft\PhpParser\Node;
use Microsoft\PhpParser\Token;

class CatchClause extends Node {
    /** @var Token */
    public $catch;
    /** @var Token */
    public $openParen;
    /** @var QualifiedName */
    public $qualifiedName;
    /**
     * @var QualifiedName[]|Token[] Remaining tokens and qualified names in the catch clause
     * (e.g. `catch (FirstException|SecondException $x)` would contain
     *  the representation of `|SecondException`)
     *
     * TODO: In the next backwards incompatible release, replace qualifiedName with qualifiedNameList?
     */
    public $otherQualifiedNameList;
    /** @var Token */
    public $variableName;
    /** @var Token */
    public $closeParen;
    /** @var StatementNode */
    public $compoundStatement;

    const CHILD_NAMES = [
        'catch',
        'openParen',
        'qualifiedName',
        'otherQualifiedNameList',
        'variableName',
        'closeParen',
        'compoundStatement'
    ];
}
