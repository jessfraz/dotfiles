<?php
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

namespace Microsoft\PhpParser\Node;

use Microsoft\PhpParser\Node;
use Microsoft\PhpParser\Token;
use Microsoft\PhpParser\TokenKind;

class PropertyDeclaration extends Node {

    /** @var Token[] */
    public $modifiers;

    /** @var Token|null question token for PHP 7.4 type declaration */
    public $questionToken;

    /** @var QualifiedName|Token|null */
    public $typeDeclaration;

    /** @var DelimitedList\ExpressionList */
    public $propertyElements;

    /** @var Token */
    public $semicolon;

    const CHILD_NAMES = [
        'modifiers',
        'questionToken',
        'typeDeclaration',
        'propertyElements',
        'semicolon'
    ];

    public function isStatic() : bool {
        if ($this->modifiers === null) {
            return false;
        }
        foreach ($this->modifiers as $modifier) {
            if ($modifier->kind === TokenKind::StaticKeyword) {
                return true;
            }
        }
        return false;
    }
}
