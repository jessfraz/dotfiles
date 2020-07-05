<?php
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

namespace Microsoft\PhpParser\Node\Expression;

use Microsoft\PhpParser\Node\Expression;
use Microsoft\PhpParser\Token;

class ArgumentExpression extends Expression {
    /** @var Token|null */
    public $byRefToken; // TODO removed in newer versions of PHP. Also only accept variable, not expression if byRef

    /** @var Token|null */
    public $dotDotDotToken;

    /** @var Expression */
    public $expression;

    const CHILD_NAMES = [
        'byRefToken',
        'dotDotDotToken',
        'expression'
    ];
}
