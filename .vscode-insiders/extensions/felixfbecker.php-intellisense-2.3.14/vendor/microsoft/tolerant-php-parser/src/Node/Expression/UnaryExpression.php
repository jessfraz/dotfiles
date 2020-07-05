<?php
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

namespace Microsoft\PhpParser\Node\Expression;

use Microsoft\PhpParser\Node\Expression;

class UnaryExpression extends Expression {
    /** @var UnaryExpression|Variable */
    public $operand;

    const CHILD_NAMES = [
        'operand'
    ];
}
