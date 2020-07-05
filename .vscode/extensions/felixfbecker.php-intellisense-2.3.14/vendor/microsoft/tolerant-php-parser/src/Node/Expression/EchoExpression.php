<?php
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

namespace Microsoft\PhpParser\Node\Expression;

use Microsoft\PhpParser\Node\Expression;
use Microsoft\PhpParser\Node\DelimitedList\ExpressionList;
use Microsoft\PhpParser\Token;

/**
 * This represents either a literal echo expression (`echo expr`)
 * or a short echo tag (`<?= expr...`)
 *
 * TODO: An echo statement cannot be used as an expression.
 * Consider refactoring this to become EchoStatement in a future backwards incompatible release.
 */
class EchoExpression extends Expression {

    /**
     * @var Token|null this is null if generated from `<?=`
     */
    public $echoKeyword;

    /** @var ExpressionList */
    public $expressions;

    const CHILD_NAMES = [
        'echoKeyword',
        'expressions'
    ];
}
