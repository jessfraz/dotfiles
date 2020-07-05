<?php
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

namespace Microsoft\PhpParser\Node;

use Microsoft\PhpParser\Token;

trait FunctionReturnType {
    /** @var Token */
    public $colonToken;
    /** @var Token|null */
    public $questionToken;
    /** @var Token|QualifiedName */
    public $returnType;
}
