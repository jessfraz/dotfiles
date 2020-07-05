<?php
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

namespace Microsoft\PhpParser\Node;

use Microsoft\PhpParser\Node;
use Microsoft\PhpParser\Token;

class MissingMemberDeclaration extends Node {

    /** @var Token[] */
    public $modifiers;

    /** @var Token|null needed along with typeDeclaration for what looked like typed property declarations but was missing VariableName */
    public $questionToken;

    /** @var QualifiedName|Token|null */
    public $typeDeclaration;

    const CHILD_NAMES = [
        'modifiers',
        'questionToken',
        'typeDeclaration',
    ];
}
