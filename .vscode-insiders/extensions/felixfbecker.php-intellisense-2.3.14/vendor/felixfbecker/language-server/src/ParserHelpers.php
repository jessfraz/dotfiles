<?php
declare(strict_types=1);

namespace LanguageServer\ParserHelpers;

use Microsoft\PhpParser;
use Microsoft\PhpParser\Node;

function isConstantFetch(Node $node) : bool
{
    $parent = $node->parent;
    return
        (
        $node instanceof Node\QualifiedName &&
        (
            $parent instanceof Node\Expression ||
            $parent instanceof Node\DelimitedList\ExpressionList ||
            $parent instanceof Node\ArrayElement ||
            ($parent instanceof Node\Parameter && $node->parent->default === $node) ||
            $parent instanceof Node\StatementNode ||
            $parent instanceof Node\CaseStatementNode
        ) &&
        !(
            $parent instanceof Node\Expression\MemberAccessExpression ||
            $parent instanceof Node\Expression\CallExpression ||
            $parent instanceof Node\Expression\ObjectCreationExpression ||
            $parent instanceof Node\Expression\ScopedPropertyAccessExpression ||
            $parent instanceof PhpParser\FunctionLike ||
            (
                $parent instanceof Node\Expression\BinaryExpression &&
                $parent->operator->kind === PhpParser\TokenKind::InstanceOfKeyword
            )
        ));
}

function getFunctionLikeDeclarationFromParameter(Node\Parameter $node)
{
    return $node->parent->parent;
}

function isBooleanExpression($expression) : bool
{
    if (!($expression instanceof Node\Expression\BinaryExpression)) {
        return false;
    }
    switch ($expression->operator->kind) {
        case PhpParser\TokenKind::InstanceOfKeyword:
        case PhpParser\TokenKind::GreaterThanToken:
        case PhpParser\TokenKind::GreaterThanEqualsToken:
        case PhpParser\TokenKind::LessThanToken:
        case PhpParser\TokenKind::LessThanEqualsToken:
        case PhpParser\TokenKind::AndKeyword:
        case PhpParser\TokenKind::AmpersandAmpersandToken:
        case PhpParser\TokenKind::LessThanEqualsGreaterThanToken:
        case PhpParser\TokenKind::OrKeyword:
        case PhpParser\TokenKind::BarBarToken:
        case PhpParser\TokenKind::XorKeyword:
        case PhpParser\TokenKind::ExclamationEqualsEqualsToken:
        case PhpParser\TokenKind::ExclamationEqualsToken:
        case PhpParser\TokenKind::CaretToken:
        case PhpParser\TokenKind::EqualsEqualsEqualsToken:
        case PhpParser\TokenKind::EqualsToken:
            return true;
    }
    return false;
}


/**
 * Tries to get the parent property declaration given a Node
 * @param Node $node
 * @return Node\PropertyDeclaration|null $node
 */
function tryGetPropertyDeclaration(Node $node)
{
    if ($node instanceof Node\Expression\Variable &&
        (($propertyDeclaration = $node->parent->parent) instanceof Node\PropertyDeclaration ||
            ($propertyDeclaration = $propertyDeclaration->parent) instanceof Node\PropertyDeclaration)
    ) {
        return $propertyDeclaration;
    }
    return null;
}

/**
 * Tries to get the parent ConstDeclaration or ClassConstDeclaration given a Node
 * @param Node $node
 * @return Node\Statement\ConstDeclaration|Node\ClassConstDeclaration|null $node
 */
function tryGetConstOrClassConstDeclaration(Node $node)
{
    if (
        $node instanceof Node\ConstElement && (
            ($constDeclaration = $node->parent->parent) instanceof Node\ClassConstDeclaration ||
            $constDeclaration instanceof Node\Statement\ConstDeclaration )
        ) {
        return $constDeclaration;
    }
    return null;
}

/**
 * Returns true if the node is a usage of `define`.
 * e.g. define('TEST_DEFINE_CONSTANT', false);
 * @param Node $node
 * @return bool
 */
function isConstDefineExpression(Node $node): bool
{
    return $node instanceof Node\Expression\CallExpression
        && $node->callableExpression instanceof Node\QualifiedName
        && strtolower($node->callableExpression->getText()) === 'define'
        && isset($node->argumentExpressionList->children[0])
        && $node->argumentExpressionList->children[0]->expression instanceof Node\StringLiteral
        && isset($node->argumentExpressionList->children[2]);
}
