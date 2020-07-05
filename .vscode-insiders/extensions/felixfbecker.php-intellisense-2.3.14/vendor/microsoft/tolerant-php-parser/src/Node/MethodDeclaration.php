<?php
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

namespace Microsoft\PhpParser\Node;

use Microsoft\PhpParser\Diagnostic;
use Microsoft\PhpParser\DiagnosticKind;
use Microsoft\PhpParser\DiagnosticsProvider;
use Microsoft\PhpParser\FunctionLike;
use Microsoft\PhpParser\Node;
use Microsoft\PhpParser\Token;
use Microsoft\PhpParser\TokenKind;

class MethodDeclaration extends Node implements FunctionLike {
    /** @var Token[] */
    public $modifiers;

    use FunctionHeader, FunctionReturnType, FunctionBody;

    const CHILD_NAMES = [
        'modifiers',

        // FunctionHeader
        'functionKeyword',
        'byRefToken',
        'name',
        'openParen',
        'parameters',
        'closeParen',

        // FunctionReturnType
        'colonToken',
        'questionToken',
        'returnType',

        // FunctionBody
        'compoundStatementOrSemicolon'
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

    public function getName() {
        return $this->name->getText($this->getFileContents());
    }

    /**
     * @return Diagnostic|null - Callers should use DiagnosticsProvider::getDiagnostics instead
     * @internal
     * @override
     */
    public function getDiagnosticForNode() {
        foreach ($this->modifiers as $modifier) {
            if ($modifier->kind === TokenKind::VarKeyword) {
                return new Diagnostic(
                    DiagnosticKind::Error,
                    "Unexpected modifier '" . DiagnosticsProvider::getTextForTokenKind($modifier->kind) . "'",
                    $modifier->start,
                    $modifier->length
                );
            }
        }
    }
}
