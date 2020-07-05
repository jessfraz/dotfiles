<?php
declare(strict_types = 1);

namespace LanguageServer;

use LanguageServer\Index\ReadableIndex;
use LanguageServer\Factory\SymbolInformationFactory;
use LanguageServerProtocol\SymbolInformation;
use Microsoft\PhpParser;
use Microsoft\PhpParser\Node;
use Microsoft\PhpParser\FunctionLike;
use phpDocumentor\Reflection\{
    DocBlock, DocBlockFactory, Fqsen, Type, TypeResolver, Types
};

class DefinitionResolver
{
    /**
     * The current project index (for retrieving existing definitions)
     *
     * @var \LanguageServer\Index\ReadableIndex
     */
    private $index;

    /**
     * Resolves strings to a type object.
     *
     * @var \phpDocumentor\Reflection\TypeResolver
     */
    private $typeResolver;

    /**
     * Parses Doc Block comments given the DocBlock text and import tables at a position.
     *
     * @var DocBlockFactory
     */
    private $docBlockFactory;

    /**
     * Creates SignatureInformation instances
     *
     * @var SignatureInformationFactory
     */
    private $signatureInformationFactory;

    /**
     * @param ReadableIndex $index
     */
    public function __construct(ReadableIndex $index)
    {
        $this->index = $index;
        $this->typeResolver = new TypeResolver;
        $this->docBlockFactory = DocBlockFactory::createInstance();
        $this->signatureInformationFactory = new SignatureInformationFactory($this);
    }

    /**
     * Builds the declaration line for a given node. Declarations with multiple lines are trimmed.
     *
     * @param Node $node
     * @return string
     */
    public function getDeclarationLineFromNode($node): string
    {
        // If node is part of a declaration list, build a declaration line that discludes other elements in the list
        //  - [PropertyDeclaration] // public $a, [$b = 3], $c; => public $b = 3;
        //  - [ConstDeclaration|ClassConstDeclaration] // "const A = 3, [B = 4];" => "const B = 4;"
        if (
            ($declaration = ParserHelpers\tryGetPropertyDeclaration($node)) && ($elements = $declaration->propertyElements) ||
            ($declaration = ParserHelpers\tryGetConstOrClassConstDeclaration($node)) && ($elements = $declaration->constElements)
        ) {
            $defLine = $declaration->getText();
            $defLineStart = $declaration->getStart();

            $defLine = \substr_replace(
                $defLine,
                $node->getFullText(),
                $elements->getFullStart() - $defLineStart,
                $elements->getFullWidth()
            );
        } else {
            $defLine = $node->getText();
        }

        // Trim string to only include first line
        $defLine = \rtrim(\strtok($defLine, "\n"), "\r");

        // TODO - pretty print rather than getting text

        return $defLine;
    }

    /**
     * Gets the documentation string for a node, if it has one
     *
     * @param Node $node
     * @return string|null
     */
    public function getDocumentationFromNode($node)
    {
        // Any NamespaceDefinition comments likely apply to the file, not the declaration itself.
        if ($node instanceof Node\Statement\NamespaceDefinition) {
            return null;
        }

        // For properties and constants, set the node to the declaration node, rather than the individual property.
        // This is because they get defined as part of a list.
        $constOrPropertyDeclaration = ParserHelpers\tryGetPropertyDeclaration($node) ?? ParserHelpers\tryGetConstOrClassConstDeclaration($node);
        if ($constOrPropertyDeclaration !== null) {
            $node = $constOrPropertyDeclaration;
        }

        // For parameters, parse the function-like declaration to get documentation for a parameter
        if ($node instanceof Node\Parameter) {
            $variableName = $node->getName();

            $functionLikeDeclaration = ParserHelpers\getFunctionLikeDeclarationFromParameter($node);
            $docBlock = $this->getDocBlock($functionLikeDeclaration);

            $parameterDocBlockTag = $this->tryGetDocBlockTagForParameter($docBlock, $variableName);
            return $parameterDocBlockTag !== null ? $parameterDocBlockTag->getDescription()->render() : null;
        }

        // For everything else, get the doc block summary corresponding to the current node.
        $docBlock = $this->getDocBlock($node);
        if ($docBlock !== null) {
            // check whether we have a description, when true, add a new paragraph
            // with the description
            $description = $docBlock->getDescription()->render();

            if (empty($description)) {
                return $docBlock->getSummary();
            }

            return $docBlock->getSummary() . "\n\n" . $description;
        }
        return null;
    }

    /**
     * Gets Doc Block with resolved names for a Node
     *
     * @param Node $node
     * @return DocBlock|null
     */
    private function getDocBlock(Node $node)
    {
        // TODO make more efficient (caching, ensure import table is in right format to begin with)
        $docCommentText = $node->getDocCommentText();
        if ($docCommentText !== null) {
            list($namespaceImportTable,,) = $node->getImportTablesForCurrentScope();
            foreach ($namespaceImportTable as $alias => $name) {
                $namespaceImportTable[$alias] = (string)$name;
            }
            $namespaceDefinition = $node->getNamespaceDefinition();
            if ($namespaceDefinition !== null && $namespaceDefinition->name !== null) {
                $namespaceName = (string)$namespaceDefinition->name->getNamespacedName();
            } else {
                $namespaceName = 'global';
            }
            $context = new Types\Context($namespaceName, $namespaceImportTable);

            try {
                // create() throws when it thinks the doc comment has invalid fields.
                // For example, a @see tag that is followed by something that doesn't look like a valid fqsen will throw.
                return $this->docBlockFactory->create($docCommentText, $context);
            } catch (\InvalidArgumentException $e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Create a Definition for a definition node
     *
     * @param Node $node
     * @param string $fqn
     * @return Definition
     */
    public function createDefinitionFromNode(Node $node, string $fqn = null): Definition
    {
        $def = new Definition;
        $def->fqn = $fqn;

        // Determines whether the suggestion will show after "new"
        $def->canBeInstantiated = (
            $node instanceof Node\Statement\ClassDeclaration &&
            // check whether it is not an abstract class
            ($node->abstractOrFinalModifier === null || $node->abstractOrFinalModifier->kind !== PhpParser\TokenKind::AbstractKeyword)
        );

        // Interfaces, classes, traits, namespaces, functions, and global const elements
        $def->isMember = !(
            $node instanceof PhpParser\ClassLike ||

            ($node instanceof Node\Statement\NamespaceDefinition && $node->name !== null) ||

            $node instanceof Node\Statement\FunctionDeclaration ||

            ($node instanceof Node\ConstElement && $node->parent->parent instanceof Node\Statement\ConstDeclaration)
        );

        // Definition is affected by global namespace fallback if it is a global constant or a global function
        $def->roamed = (
            $fqn !== null
            && strpos($fqn, '\\') === false
            && (
                ($node instanceof Node\ConstElement && $node->parent->parent instanceof Node\Statement\ConstDeclaration)
                || $node instanceof Node\Statement\FunctionDeclaration
            )
        );

        // Static methods and static property declarations
        $def->isStatic = (
            ($node instanceof Node\MethodDeclaration && $node->isStatic()) ||

            (($propertyDeclaration = ParserHelpers\tryGetPropertyDeclaration($node)) !== null
            && $propertyDeclaration->isStatic())
        );

        if ($node instanceof Node\Statement\ClassDeclaration &&
            // TODO - this should be better represented in the parser API
            $node->classBaseClause !== null && $node->classBaseClause->baseClass !== null) {
            $def->extends = [(string)$node->classBaseClause->baseClass->getResolvedName()];
        } elseif (
            $node instanceof Node\Statement\InterfaceDeclaration &&
            // TODO - this should be better represented in the parser API
            $node->interfaceBaseClause !== null && $node->interfaceBaseClause->interfaceNameList !== null
        ) {
            $def->extends = [];
            foreach ($node->interfaceBaseClause->interfaceNameList->getValues() as $n) {
                $def->extends[] = (string)$n->getResolvedName();
            }
        }

        $def->symbolInformation = SymbolInformationFactory::fromNode($node, $fqn);

        if ($def->symbolInformation !== null) {
            $def->type = $this->getTypeFromNode($node);
            $def->declarationLine = $this->getDeclarationLineFromNode($node);
            $def->documentation = $this->getDocumentationFromNode($node);
        }

        if ($node instanceof FunctionLike) {
            $def->signatureInformation = $this->signatureInformationFactory->create($node);
        }

        return $def;
    }

    /**
     * Given any node, returns the Definition object of the symbol that is referenced
     *
     * @param Node $node Any reference node
     * @return Definition|null
     */
    public function resolveReferenceNodeToDefinition(Node $node)
    {
        $parent = $node->parent;
        // Variables are not indexed globally, as they stay in the file scope anyway.
        // Ignore variable nodes that are part of ScopedPropertyAccessExpression,
        // as the scoped property access expression node is handled separately.
        if ($node instanceof Node\Expression\Variable &&
            !($parent instanceof Node\Expression\ScopedPropertyAccessExpression)) {
            // Resolve $this to the containing class definition.
            if ($node->getName() === 'this' && $fqn = $this->getContainingClassFqn($node)) {
                return $this->index->getDefinition($fqn, false);
            }

            // Resolve the variable to a definition node (assignment, param or closure use)
            $defNode = $this->resolveVariableToNode($node);
            if ($defNode === null) {
                return null;
            }
            return $this->createDefinitionFromNode($defNode);
        }
        // Other references are references to a global symbol that have an FQN
        // Find out the FQN
        $fqn = $this->resolveReferenceNodeToFqn($node);
        if (!$fqn) {
            return null;
        }

        if ($fqn === 'self' || $fqn === 'static') {
            // Resolve self and static keywords to the containing class
            // (This is not 100% correct for static but better than nothing)
            $classNode = $node->getFirstAncestor(Node\Statement\ClassDeclaration::class);
            if (!$classNode) {
                return;
            }
            $fqn = (string)$classNode->getNamespacedName();
            if (!$fqn) {
                return;
            }
        } else if ($fqn === 'parent') {
            // Resolve parent keyword to the base class FQN
            $classNode = $node->getFirstAncestor(Node\Statement\ClassDeclaration::class);
            if (!$classNode || !$classNode->classBaseClause || !$classNode->classBaseClause->baseClass) {
                return;
            }
            $fqn = (string)$classNode->classBaseClause->baseClass->getResolvedName();
            if (!$fqn) {
                return;
            }
        }

        // If the node is a function or constant, it could be namespaced, but PHP falls back to global
        // http://php.net/manual/en/language.namespaces.fallback.php
        // TODO - verify that this is not a method
        $globalFallback = ParserHelpers\isConstantFetch($node) || $parent instanceof Node\Expression\CallExpression;

        // Return the Definition object from the index index
        return $this->index->getDefinition($fqn, $globalFallback);
    }

    /**
     * Given any node, returns the FQN of the symbol that is referenced
     * Returns null if the FQN could not be resolved or the reference node references a variable
     * May also return "static", "self" or "parent"
     *
     * @param Node $node
     * @return string|null
     */
    public function resolveReferenceNodeToFqn(Node $node)
    {
        // TODO all name tokens should be a part of a node
        if ($node instanceof Node\QualifiedName) {
            return $this->resolveQualifiedNameNodeToFqn($node);
        } else if ($node instanceof Node\Expression\MemberAccessExpression) {
            return $this->resolveMemberAccessExpressionNodeToFqn($node);
        } else if (ParserHelpers\isConstantFetch($node)) {
            return (string)($node->getNamespacedName());
        } else if (
            // A\B::C - constant access expression
            $node instanceof Node\Expression\ScopedPropertyAccessExpression
            && !($node->memberName instanceof Node\Expression\Variable)
        ) {
            return $this->resolveScopedPropertyAccessExpressionNodeToFqn($node);
        } else if (
            // A\B::$c - static property access expression
            $node->parent instanceof Node\Expression\ScopedPropertyAccessExpression
        ) {
            return $this->resolveScopedPropertyAccessExpressionNodeToFqn($node->parent);
        }

        return null;
    }

    private function resolveQualifiedNameNodeToFqn(Node\QualifiedName $node)
    {
        $parent = $node->parent;

        if ($parent instanceof Node\TraitSelectOrAliasClause) {
            return null;
        }
        // Add use clause references
        if (($useClause = $parent) instanceof Node\NamespaceUseGroupClause
            || $useClause instanceof Node\NamespaceUseClause
        ) {
            $contents = $node->getFileContents();
            if ($useClause instanceof Node\NamespaceUseGroupClause) {
                $prefix = $useClause->parent->parent->namespaceName;
                if ($prefix === null) {
                    return null;
                }
                $name = PhpParser\ResolvedName::buildName($prefix->nameParts, $contents);
                $name->addNameParts($node->nameParts, $contents);
                $name = (string)$name;

                if ($useClause->functionOrConst === null) {
                    $useClause = $node->getFirstAncestor(Node\Statement\NamespaceUseDeclaration::class);
                    if ($useClause->functionOrConst !== null && $useClause->functionOrConst->kind === PhpParser\TokenKind::FunctionKeyword) {
                        $name .= '()';
                    }
                }
                return $name;
            } else {
                $name = (string) PhpParser\ResolvedName::buildName($node->nameParts, $contents);
                if ($useClause->groupClauses === null && $useClause->parent->parent->functionOrConst !== null && $useClause->parent->parent->functionOrConst->kind === PhpParser\TokenKind::FunctionKeyword) {
                    $name .= '()';
                }
            }

            return $name;
        }

        // For extends, implements, type hints and classes of classes of static calls use the name directly
        $name = (string) ($node->getResolvedName() ?? $node->getNamespacedName());

        if ($node->parent instanceof Node\Expression\CallExpression) {
            $name .= '()';
        }
        return $name;
    }

    private function resolveMemberAccessExpressionNodeToFqn(Node\Expression\MemberAccessExpression $access)
    {
        if ($access->memberName instanceof Node\Expression) {
            // Cannot get definition if right-hand side is expression
            return null;
        }
        // Get the type of the left-hand expression
        $varType = $this->resolveExpressionNodeToType($access->dereferencableExpression);

        if ($varType instanceof Types\Compound) {
            // For compound types, use the first FQN we find
            // (popular use case is ClassName|null)
            for ($i = 0; $t = $varType->get($i); $i++) {
                if (
                    $t instanceof Types\This
                    || $t instanceof Types\Object_
                    || $t instanceof Types\Static_
                    || $t instanceof Types\Self_
                ) {
                    $varType = $t;
                    break;
                }
            }
        }
        if (
            $varType instanceof Types\This
            || $varType instanceof Types\Static_
            || $varType instanceof Types\Self_
        ) {
            // $this/static/self is resolved to the containing class
            $classFqn = self::getContainingClassFqn($access);
        } else if (!($varType instanceof Types\Object_) || $varType->getFqsen() === null) {
            // Left-hand expression could not be resolved to a class
            return null;
        } else {
            $classFqn = substr((string)$varType->getFqsen(), 1);
        }
        $memberSuffix = '->' . (string)($access->memberName->getText() ?? $access->memberName->getText($access->getFileContents()));
        if ($access->parent instanceof Node\Expression\CallExpression) {
            $memberSuffix .= '()';
        }

        // Find the right class that implements the member
        $implementorFqns = [$classFqn];
        $visitedFqns = [];

        while ($implementorFqn = array_shift($implementorFqns)) {
            // If the member FQN exists, return it
            if ($this->index->getDefinition($implementorFqn . $memberSuffix)) {
                return $implementorFqn . $memberSuffix;
            }
            // Get Definition of implementor class
            $implementorDef = $this->index->getDefinition($implementorFqn);
            // If it doesn't exist, return the initial guess
            if ($implementorDef === null) {
                break;
            }
            // Note the FQN as visited
            $visitedFqns[] = $implementorFqn;
            // Repeat for parent class
            if ($implementorDef->extends) {
                foreach ($implementorDef->extends as $extends) {
                    // Don't add the parent FQN if it's already been visited
                    if (!\in_array($extends, $visitedFqns)) {
                        $implementorFqns[] = $extends;
                    }
                }
            }
        }

        return $classFqn . $memberSuffix;
    }

    private function resolveScopedPropertyAccessExpressionNodeToFqn(Node\Expression\ScopedPropertyAccessExpression $scoped)
    {
        if ($scoped->scopeResolutionQualifier instanceof Node\Expression\Variable) {
            $varType = $this->getTypeFromNode($scoped->scopeResolutionQualifier);
            if ($varType === null) {
                return null;
            }
            $className = substr((string)$varType->getFqsen(), 1);
        } elseif ($scoped->scopeResolutionQualifier instanceof Node\QualifiedName) {
            $className = (string)$scoped->scopeResolutionQualifier->getResolvedName();
        } else {
            return null;
        }

        if ($className === 'self' || $className === 'static' || $className === 'parent') {
            // self and static are resolved to the containing class
            $classNode = $scoped->getFirstAncestor(Node\Statement\ClassDeclaration::class);
            if ($classNode === null) {
                return null;
            }
            if ($className === 'parent') {
                // parent is resolved to the parent class
                if (!isset($classNode->extends)) {
                    return null;
                }
                $className = (string)$classNode->extends->getResolvedName();
            } else {
                $className = (string)$classNode->getNamespacedName();
            }
        } elseif ($scoped->scopeResolutionQualifier instanceof Node\QualifiedName) {
            $className = $scoped->scopeResolutionQualifier->getResolvedName();
        }
        if ($scoped->memberName instanceof Node\Expression\Variable) {
            if ($scoped->parent instanceof Node\Expression\CallExpression) {
                return null;
            }
            $memberName = $scoped->memberName->getName();
            if (empty($memberName)) {
                return null;
            }
            $name = (string)$className . '::$' . $memberName;
        } else {
            $name = (string)$className . '::' . $scoped->memberName->getText($scoped->getFileContents());
        }
        if ($scoped->parent instanceof Node\Expression\CallExpression) {
            $name .= '()';
        }
        return $name;
    }

    /**
     * Returns FQN of the class a node is contained in
     * Returns null if the class is anonymous or the node is not contained in a class
     *
     * @param Node $node
     * @return string|null
     */
    private static function getContainingClassFqn(Node $node)
    {
        $classNode = $node->getFirstAncestor(Node\Statement\ClassDeclaration::class);
        if ($classNode === null) {
            return null;
        }
        return (string)$classNode->getNamespacedName();
    }

    /**
     * Returns the type of the class a node is contained in
     * Returns null if the class is anonymous or the node is not contained in a class
     *
     * @param Node $node The node used to find the containing class
     *
     * @return Types\Object_|null
     */
    private function getContainingClassType(Node $node)
    {
        $classFqn = $this->getContainingClassFqn($node);
        return $classFqn ? new Types\Object_(new Fqsen('\\' . $classFqn)) : null;
    }

    /**
     * Returns the assignment or parameter node where a variable was defined
     *
     * @param Node\Expression\Variable|Node\Expression\ClosureUse $var The variable access
     * @return Node\Expression\Assign|Node\Expression\AssignOp|Node\Param|Node\Expression\ClosureUse|null
     */
    public function resolveVariableToNode($var)
    {
        $n = $var;
        // When a use is passed, start outside the closure to not return immediately
        // Use variable vs variable parsing?
        if ($var instanceof Node\UseVariableName) {
            $n = $var->getFirstAncestor(Node\Expression\AnonymousFunctionCreationExpression::class)->parent;
            $name = $var->getName();
        } else if ($var instanceof Node\Expression\Variable || $var instanceof Node\Parameter) {
            $name = $var->getName();
        } else {
            throw new \InvalidArgumentException('$var must be Variable, Param or ClosureUse, not ' . get_class($var));
        }
        if (empty($name)) {
            return null;
        }

        $shouldDescend = function ($nodeToDescand) {
            // Make sure not to decend into functions or classes (they represent a scope boundary)
            return !($nodeToDescand instanceof PhpParser\FunctionLike || $nodeToDescand instanceof PhpParser\ClassLike);
        };

        // Traverse the AST up
        do {
            // If a function is met, check the parameters and use statements
            if ($n instanceof PhpParser\FunctionLike) {
                if ($n->parameters !== null) {
                    foreach ($n->parameters->getElements() as $param) {
                        if ($param->getName() === $name) {
                            return $param;
                        }
                    }
                }
                // If it is a closure, also check use statements
                if ($n instanceof Node\Expression\AnonymousFunctionCreationExpression &&
                    $n->anonymousFunctionUseClause !== null &&
                    $n->anonymousFunctionUseClause->useVariableNameList !== null) {
                    foreach ($n->anonymousFunctionUseClause->useVariableNameList->getElements() as $use) {
                        if ($use->getName() === $name) {
                            return $use;
                        }
                    }
                }
                break;
            }

            // Check each previous sibling node and their descendents for a variable assignment to that variable
            // Each previous sibling could contain a declaration of the variable
            while (($prevSibling = $n->getPreviousSibling()) !== null && $n = $prevSibling) {

                // Check the sibling itself
                if (self::isVariableDeclaration($n, $name)) {
                    return $n;
                }

                // Check descendant of this sibling (e.g. the children of a previous if block)
                foreach ($n->getDescendantNodes($shouldDescend) as $descendant) {
                    if (self::isVariableDeclaration($descendant, $name)) {
                        return $descendant;
                    }
                }
            }
        } while (isset($n) && $n = $n->parent);
        // Return null if nothing was found
        return null;
    }

    /**
     * Checks whether the given Node declares the given variable name
     *
     * @param Node $n The Node to check
     * @param string $name The name of the wanted variable
     * @return bool
     */
    private static function isVariableDeclaration(Node $n, string $name)
    {
        if (
            // TODO - clean this up
            ($n instanceof Node\Expression\AssignmentExpression && $n->operator->kind === PhpParser\TokenKind::EqualsToken)
            && $n->leftOperand instanceof Node\Expression\Variable && $n->leftOperand->getName() === $name
        ) {
            return true;
        }

        if (
            ($n instanceof Node\ForeachValue || $n instanceof Node\ForeachKey)
            && $n->expression instanceof Node\Expression\Variable
            && $n->expression->getName() === $name
        ) {
            return true;
        }

        return false;
    }

    /**
     * Given an expression node, resolves that expression recursively to a type.
     * If the type could not be resolved, returns Types\Mixed_.
     *
     * @param Node\Expression $expr
     * @return \phpDocumentor\Reflection\Type|null
     */
    public function resolveExpressionNodeToType($expr)
    {
        // PARENTHESIZED EXPRESSION
        // Retrieve inner expression from parenthesized expression
        while ($expr instanceof Node\Expression\ParenthesizedExpression) {
            $expr = $expr->expression;
        }

        if ($expr == null || $expr instanceof PhpParser\MissingToken || $expr instanceof PhpParser\SkippedToken) {
            // TODO some members are null or Missing/SkippedToken
            // How do we handle this more generally?
            return new Types\Mixed_;
        }

        // VARIABLE
        //   $this -> Type\this
        //   $myVariable -> type of corresponding assignment expression
        if ($expr instanceof Node\Expression\Variable || $expr instanceof Node\UseVariableName) {
            if ($expr->getName() === 'this') {
                return new Types\Object_(new Fqsen('\\' . $this->getContainingClassFqn($expr)));
            }
            // Find variable definition (parameter or assignment expression)
            $defNode = $this->resolveVariableToNode($expr);
            if ($defNode instanceof Node\Expression\AssignmentExpression || $defNode instanceof Node\UseVariableName) {
                return $this->resolveExpressionNodeToType($defNode);
            }
            if ($defNode instanceof Node\ForeachKey || $defNode instanceof Node\ForeachValue) {
                return $this->getTypeFromNode($defNode);
            }
            if ($defNode instanceof Node\Parameter) {
                return $this->getTypeFromNode($defNode);
            }
        }

        // FUNCTION CALL
        // Function calls are resolved to type corresponding to their FQN
        if ($expr instanceof Node\Expression\CallExpression &&
            !(
                $expr->callableExpression instanceof Node\Expression\ScopedPropertyAccessExpression ||
                $expr->callableExpression instanceof Node\Expression\MemberAccessExpression)
        ) {
            // Find the function definition
            if ($expr->callableExpression instanceof Node\Expression) {
                // Cannot get type for dynamic function call
                return new Types\Mixed_;
            }

            if ($expr->callableExpression instanceof Node\QualifiedName) {
                $fqn = $expr->callableExpression->getResolvedName() ?? $expr->callableExpression->getNamespacedName();
                $fqn .= '()';
                $def = $this->index->getDefinition($fqn, true);
                if ($def !== null) {
                    return $def->type;
                }
            }
        }

        // TRUE / FALSE / NULL
        // Resolve true and false reserved words to Types\Boolean
        if ($expr instanceof Node\ReservedWord) {
            $token = $expr->children->kind;
            if ($token === PhpParser\TokenKind::TrueReservedWord || $token === PhpParser\TokenKind::FalseReservedWord) {
                return new Types\Boolean;
            }

            if ($token === PhpParser\TokenKind::NullReservedWord) {
                return new Types\Null_;
            }
        }

        // CONSTANT FETCH
        // Resolve constants by retrieving corresponding definition type from FQN
        if (ParserHelpers\isConstantFetch($expr)) {
            $fqn = (string)$expr->getNamespacedName();
            $def = $this->index->getDefinition($fqn, true);
            if ($def !== null) {
                return $def->type;
            }
        }

        // MEMBER CALL EXPRESSION/SCOPED PROPERTY CALL EXPRESSION
        //   The type of the member/scoped property call expression is the type of the method, so resolve the
        //   type of the callable expression.
        if ($expr instanceof Node\Expression\CallExpression && (
            $expr->callableExpression instanceof Node\Expression\MemberAccessExpression ||
            $expr->callableExpression instanceof Node\Expression\ScopedPropertyAccessExpression)
        ) {
            return $this->resolveExpressionNodeToType($expr->callableExpression);
        }

        // MEMBER ACCESS EXPRESSION
        if ($expr instanceof Node\Expression\MemberAccessExpression) {
            if ($expr->memberName instanceof Node\Expression) {
                return new Types\Mixed_;
            }
            $var = $expr->dereferencableExpression;

           // Resolve object
            $objType = $this->resolveExpressionNodeToType($var);
            if (!($objType instanceof Types\Compound)) {
                $objType = new Types\Compound([$objType]);
            }
            for ($i = 0; $t = $objType->get($i); $i++) {
                if ($t instanceof Types\This) {
                    $classFqn = self::getContainingClassFqn($expr);
                    if ($classFqn === null) {
                        return new Types\Mixed_;
                    }
                } else if (!($t instanceof Types\Object_) || $t->getFqsen() === null) {
                    return new Types\Mixed_;
                } else {
                    $classFqn = substr((string)$t->getFqsen(), 1);
                }
                $add = '->' . $expr->memberName->getText($expr->getFileContents());
                if ($expr->parent instanceof Node\Expression\CallExpression) {
                    $add .= '()';
                }
                $classDef = $this->index->getDefinition($classFqn);
                if ($classDef !== null) {
                    foreach ($classDef->getAncestorDefinitions($this->index, true) as $fqn => $def) {
                        $def = $this->index->getDefinition($fqn . $add);
                        if ($def !== null) {
                            if ($def->type instanceof Types\This || $def->type instanceof Types\Self_) {
                                return new Types\Object_(new Fqsen('\\' . $classFqn));
                            }
                            return $def->type;
                        }
                    }
                }
            }
        }

        // SCOPED PROPERTY ACCESS EXPRESSION
        if ($expr instanceof Node\Expression\ScopedPropertyAccessExpression) {
            $classType = $this->resolveClassNameToType($expr->scopeResolutionQualifier);
            if (!($classType instanceof Types\Object_) || $classType->getFqsen() === null) {
                return new Types\Mixed_;
            }
            $fqn = substr((string)$classType->getFqsen(), 1) . '::';

            // TODO is there a cleaner way to do this?
            $fqn .= $expr->memberName->getText() ?? $expr->memberName->getText($expr->getFileContents());
            if ($expr->parent instanceof Node\Expression\CallExpression) {
                $fqn .= '()';
            }

            $def = $this->index->getDefinition($fqn);
            if ($def === null) {
                return new Types\Mixed_;
            }
            return $def->type;
        }

        // OBJECT CREATION EXPRESSION
        //   new A() => resolves to the type of the class type designator (A)
        //   TODO: new $this->a => resolves to the string represented by "a"
        if ($expr instanceof Node\Expression\ObjectCreationExpression) {
            return $this->resolveClassNameToType($expr->classTypeDesignator);
        }

        // CLONE EXPRESSION
        //   clone($a) => resolves to the type of $a
        if ($expr instanceof Node\Expression\CloneExpression) {
            return $this->resolveExpressionNodeToType($expr->expression);
        }

        // ASSIGNMENT EXPRESSION
        //   $a = $myExpression => resolves to the type of the right-hand operand
        if ($expr instanceof Node\Expression\AssignmentExpression) {
            return $this->resolveExpressionNodeToType($expr->rightOperand);
        }

        // TERNARY EXPRESSION
        //   $condition ? $ifExpression : $elseExpression => reslves to type of $ifCondition or $elseExpression
        //   $condition ?: $elseExpression => resolves to type of $condition or $elseExpression
        if ($expr instanceof Node\Expression\TernaryExpression) {
            // ?:
            if ($expr->ifExpression === null) {
                return new Types\Compound([
                    $this->resolveExpressionNodeToType($expr->condition), // TODO: why?
                    $this->resolveExpressionNodeToType($expr->elseExpression)
                ]);
            }
            // Ternary is a compound of the two possible values
            return new Types\Compound([
                $this->resolveExpressionNodeToType($expr->ifExpression),
                $this->resolveExpressionNodeToType($expr->elseExpression)
            ]);
        }

        // NULL COALLESCE
        //   $rightOperand ?? $leftOperand => resolves to type of $rightOperand or $leftOperand
        if ($expr instanceof Node\Expression\BinaryExpression && $expr->operator->kind === PhpParser\TokenKind::QuestionQuestionToken) {
            // ?? operator
            return new Types\Compound([
                $this->resolveExpressionNodeToType($expr->leftOperand),
                $this->resolveExpressionNodeToType($expr->rightOperand)
            ]);
        }

        // BOOLEAN EXPRESSIONS: resolve to Types\Boolean
        //   (bool) $expression
        //   !$expression
        //   empty($var)
        //   isset($var)
        //   >, >=, <, <=, &&, ||, AND, OR, XOR, ==, ===, !=, !==
        if (
            ParserHelpers\isBooleanExpression($expr)

            || ($expr instanceof Node\Expression\CastExpression && $expr->castType->kind === PhpParser\TokenKind::BoolCastToken)
            || ($expr instanceof Node\Expression\UnaryOpExpression && $expr->operator->kind === PhpParser\TokenKind::ExclamationToken)
            || $expr instanceof Node\Expression\EmptyIntrinsicExpression
            || $expr instanceof Node\Expression\IssetIntrinsicExpression
        ) {
            return new Types\Boolean;
        }

        // STRING EXPRESSIONS: resolve to Types\String
        //   [concatenation] .=, .
        //   [literals] "hello", \b"hello", \B"hello", 'hello', \b'hello', HEREDOC, NOWDOC
        //   [cast] (string) "hello"
        //
        //   TODO: Magic constants (__CLASS__, __DIR__, __FUNCTION__, __METHOD__, __NAMESPACE__, __TRAIT__, __FILE__)
        if (
            ($expr instanceof Node\Expression\BinaryExpression &&
                ($expr->operator->kind === PhpParser\TokenKind::DotToken || $expr->operator->kind === PhpParser\TokenKind::DotEqualsToken)) ||
            $expr instanceof Node\StringLiteral ||
            ($expr instanceof Node\Expression\CastExpression && $expr->castType->kind === PhpParser\TokenKind::StringCastToken)
        ) {
            return new Types\String_;
        }

        // BINARY EXPRESSIONS:
        // Resolve to Types\Integer if both left and right operands are integer types, otherwise Types\Float
        //   [operator] +, -, *, **
        //   [assignment] *=, **=, -=, +=
        // Resolve to Types\Float
        //   [assignment] /=
        if (
            $expr instanceof Node\Expression\BinaryExpression &&
            ($operator = $expr->operator->kind)
            && ($operator === PhpParser\TokenKind::PlusToken ||
                $operator === PhpParser\TokenKind::AsteriskAsteriskToken ||
                $operator === PhpParser\TokenKind::AsteriskToken ||
                $operator === PhpParser\TokenKind::MinusToken ||

                // Assignment expressions (TODO: consider making this a type of AssignmentExpression rather than kind of BinaryExpression)
                $operator === PhpParser\TokenKind::AsteriskEqualsToken||
                $operator === PhpParser\TokenKind::AsteriskAsteriskEqualsToken ||
                $operator === PhpParser\TokenKind::MinusEqualsToken ||
                $operator === PhpParser\TokenKind::PlusEqualsToken
            )
        ) {
            if (
                $this->resolveExpressionNodeToType($expr->leftOperand) instanceof Types\Integer
                && $this->resolveExpressionNodeToType($expr->rightOperand) instanceof Types\Integer
            ) {
                return new Types\Integer;
            }
            return new Types\Float_;
        } else if (
            $expr instanceof Node\Expression\BinaryExpression &&
            $expr->operator->kind === PhpParser\TokenKind::SlashEqualsToken
        ) {
            return new Types\Float_;
        }

        // INTEGER EXPRESSIONS: resolve to Types\Integer
        //   [literal] 1
        //   [operator] <=>, &, ^, |
        //   TODO: Magic constants (__LINE__)
        if (
            // TODO: consider different Node types of float/int, also better property name (not "children")
            ($expr instanceof Node\NumericLiteral && $expr->children->kind === PhpParser\TokenKind::IntegerLiteralToken) ||
            $expr instanceof Node\Expression\BinaryExpression && (
                ($operator = $expr->operator->kind)
                && ($operator === PhpParser\TokenKind::LessThanEqualsGreaterThanToken ||
                    $operator === PhpParser\TokenKind::AmpersandToken ||
                    $operator === PhpParser\TokenKind::CaretToken ||
                    $operator === PhpParser\TokenKind::BarToken)
            )
        ) {
            return new Types\Integer;
        }

        // FLOAT EXPRESSIONS: resolve to Types\Float
        //   [literal] 1.5
        //   [operator] /
        //   [cast] (double)
        if (
            $expr instanceof Node\NumericLiteral && $expr->children->kind === PhpParser\TokenKind::FloatingLiteralToken ||
            ($expr instanceof Node\Expression\CastExpression && $expr->castType->kind === PhpParser\TokenKind::DoubleCastToken) ||
            ($expr instanceof Node\Expression\BinaryExpression && $expr->operator->kind === PhpParser\TokenKind::SlashToken)
        ) {
            return new Types\Float_;
        }

        // ARRAY CREATION EXPRESSION:
        // Resolve to Types\Array (Types\Compound of value and key types)
        //  [a, b, c]
        //  [1=>"hello", "hi"=>1, 4=>[]]s
        if ($expr instanceof Node\Expression\ArrayCreationExpression) {
            $valueTypes = [];
            $keyTypes = [];
            if ($expr->arrayElements !== null) {
                foreach ($expr->arrayElements->getElements() as $item) {
                    $valueTypes[] = $this->resolveExpressionNodeToType($item->elementValue);
                    $keyTypes[] = $item->elementKey ? $this->resolveExpressionNodeToType($item->elementKey) : new Types\Integer;
                }
            }
            $valueTypes = array_unique($valueTypes);
            $keyTypes = array_unique($keyTypes);
            if (empty($valueTypes)) {
                $valueType = null;
            } else if (count($valueTypes) === 1) {
                $valueType = $valueTypes[0];
            } else {
                $valueType = new Types\Compound($valueTypes);
            }
            if (empty($keyTypes)) {
                $keyType = null;
            } else if (count($keyTypes) === 1) {
                $keyType = $keyTypes[0];
            } else {
                $keyType = new Types\Compound($keyTypes);
            }
            return new Types\Array_($valueType, $keyType);
        }

        // SUBSCRIPT EXPRESSION
        // $myArray[3]
        // $myArray{"hello"}
        if ($expr instanceof Node\Expression\SubscriptExpression) {
            $varType = $this->resolveExpressionNodeToType($expr->postfixExpression);
            if (!($varType instanceof Types\Array_)) {
                return new Types\Mixed_;
            }
            return $varType->getValueType();
        }

        // SCRIPT INCLUSION EXPRESSION
        //   include, require, include_once, require_once
        if ($expr instanceof Node\Expression\ScriptInclusionExpression) {
            // TODO: resolve path to PhpDocument and find return statement
            return new Types\Mixed_;
        }

        if ($expr instanceof Node\QualifiedName) {
            return $this->resolveClassNameToType($expr);
        }

        return new Types\Mixed_;
    }


    /**
     * Takes any class name node (from a static method call, or new node) and returns a Type object
     * Resolves keywords like self, static and parent
     *
     * @param Node|PhpParser\Token $class
     * @return Type
     */
    public function resolveClassNameToType($class): Type
    {
        if ($class instanceof Node\Expression) {
            return new Types\Mixed_;
        }
        if ($class instanceof PhpParser\Token && $class->kind === PhpParser\TokenKind::ClassKeyword) {
            // Anonymous class
            return new Types\Object_;
        }
        if ($class instanceof PhpParser\Token && $class->kind === PhpParser\TokenKind::StaticKeyword) {
            // `new static`
            return new Types\Static_;
        }
        $className = (string)$class->getResolvedName();

        if ($className === 'self' || $className === 'parent') {
            $classNode = $class->getFirstAncestor(Node\Statement\ClassDeclaration::class);
            if ($className === 'parent') {
                if ($classNode === null || $classNode->classBaseClause === null) {
                    return new Types\Object_;
                }
                // parent is resolved to the parent class
                $classFqn = (string)$classNode->classBaseClause->baseClass->getResolvedName();
            } else {
                if ($classNode === null) {
                    return new Types\Self_;
                }
                // self is resolved to the containing class
                $classFqn = (string)$classNode->getNamespacedName();
            }
            return new Types\Object_(new Fqsen('\\' . $classFqn));
        }
        return new Types\Object_(new Fqsen('\\' . $className));
    }

    /**
     * Returns the type a reference to this symbol will resolve to.
     * For properties and constants, this is the type of the property/constant.
     * For functions and methods, this is the return type.
     * For parameters, this is the type of the parameter.
     * For classes and interfaces, this is the class type (object).
     * For variables / assignments, this is the documented type or type the assignment resolves to.
     * Can also be a compound type.
     * If it is unknown, will be Types\Mixed_.
     * Returns null if the node does not have a type.
     *
     * @param Node $node
     * @return \phpDocumentor\Reflection\Type|null
     */
    public function getTypeFromNode($node)
    {
        if (ParserHelpers\isConstDefineExpression($node)) {
            // constants with define() like
            // define('TEST_DEFINE_CONSTANT', false);
            return $this->resolveExpressionNodeToType($node->argumentExpressionList->children[2]->expression);
        }

        // PARAMETERS
        // Get the type of the parameter:
        //   1. Doc block
        //   2. Parameter type and default
        if ($node instanceof Node\Parameter) {
            // Parameters
            // Get the doc block for the the function call
            // /**
            //  * @param MyClass $myParam
            //  */
            //  function foo($a)
            $functionLikeDeclaration = ParserHelpers\getFunctionLikeDeclarationFromParameter($node);
            $variableName = $node->getName();
            $docBlock = $this->getDocBlock($functionLikeDeclaration);

            $parameterDocBlockTag = $this->tryGetDocBlockTagForParameter($docBlock, $variableName);
            if ($parameterDocBlockTag !== null && ($type = $parameterDocBlockTag->getType())) {
                // Doc block comments supercede all other forms of type inference
                return $type;
            }

            // function foo(MyClass $a)
            if ($node->typeDeclaration !== null) {
                // Use PHP7 return type hint
                if ($node->typeDeclaration instanceof PhpParser\Token) {
                    // Resolve a string like "bool" to a type object
                    $type = $this->typeResolver->resolve($node->typeDeclaration->getText($node->getFileContents()));
                } else {
                    $type = new Types\Object_(new Fqsen('\\' . (string)$node->typeDeclaration->getResolvedName()));
                }
            }
            // function foo($a = 3)
            if ($node->default !== null) {
                $defaultType = $this->resolveExpressionNodeToType($node->default);
                if (isset($type) && !is_a($type, get_class($defaultType))) {
                    // TODO - verify it is worth creating a compound type
                    return new Types\Compound([$type, $defaultType]);
                }
                $type = $defaultType;
            }
            return $type ?? new Types\Mixed_;
        }

        // FUNCTIONS AND METHODS
        // Get the return type
        //   1. doc block
        //   2. return type hint
        //   3. TODO: infer from return statements
        if ($node instanceof PhpParser\FunctionLike) {
            // Functions/methods
            $docBlock = $this->getDocBlock($node);
            if (
                $docBlock !== null
                && !empty($returnTags = $docBlock->getTagsByName('return'))
                && $returnTags[0]->getType() !== null
            ) {
                // Use @return tag
                $returnType = $returnTags[0]->getType();
                if ($returnType instanceof Types\Self_) {
                    $selfType = $this->getContainingClassType($node);
                    if ($selfType) {
                        return $selfType;
                    }
                }
                return $returnType;
            }
            if ($node->returnType !== null && !($node->returnType instanceof PhpParser\MissingToken)) {
                // Use PHP7 return type hint
                if ($node->returnType instanceof PhpParser\Token) {
                    // Resolve a string like "bool" to a type object
                    return $this->typeResolver->resolve($node->returnType->getText($node->getFileContents()));
                } elseif ($node->returnType->getResolvedName() === 'self') {
                    $selfType = $this->getContainingClassType($node);
                    if ($selfType !== null) {
                        return $selfType;
                    }
                }
                return new Types\Object_(new Fqsen('\\' . (string)$node->returnType->getResolvedName()));
            }
            // Unknown return type
            return new Types\Mixed_;
        }

        // FOREACH KEY/VARIABLE
        if ($node instanceof Node\ForeachKey || $node->parent instanceof Node\ForeachKey) {
            $foreach = $node->getFirstAncestor(Node\Statement\ForeachStatement::class);
            $collectionType = $this->resolveExpressionNodeToType($foreach->forEachCollectionName);
            if ($collectionType instanceof Types\Array_) {
                return $collectionType->getKeyType();
            }
            return new Types\Mixed_();
        }

        // FOREACH VALUE/VARIABLE
        if ($node instanceof Node\ForeachValue
            || ($node instanceof Node\Expression\Variable && $node->parent instanceof Node\ForeachValue)
        ) {
            $foreach = $node->getFirstAncestor(Node\Statement\ForeachStatement::class);
            $collectionType = $this->resolveExpressionNodeToType($foreach->forEachCollectionName);
            if ($collectionType instanceof Types\Array_) {
                return $collectionType->getValueType();
            }
            return new Types\Mixed_();
        }

        // PROPERTIES, CONSTS, CLASS CONSTS, ASSIGNMENT EXPRESSIONS
        // Get the documented type the assignment resolves to.
        if (
            ($declarationNode =
                ParserHelpers\tryGetPropertyDeclaration($node) ??
                ParserHelpers\tryGetConstOrClassConstDeclaration($node)
            ) !== null ||
            ($node = $node->parent) instanceof Node\Expression\AssignmentExpression) {
            $declarationNode = $declarationNode ?? $node;

            // Property, constant or variable
            // Use @var tag
            if (
                ($docBlock = $this->getDocBlock($declarationNode))
                && !empty($varTags = $docBlock->getTagsByName('var'))
                && ($type = $varTags[0]->getType())
            ) {
                return $type;
            }

            // Resolve the expression
            if ($declarationNode instanceof Node\PropertyDeclaration) {
                // TODO should have default
                if (isset($node->parent->rightOperand)) {
                    return $this->resolveExpressionNodeToType($node->parent->rightOperand);
                }
            } else if ($node instanceof Node\ConstElement) {
                return $this->resolveExpressionNodeToType($node->assignment);
            } else if ($node instanceof Node\Expression\AssignmentExpression) {
                return $this->resolveExpressionNodeToType($node->rightOperand);
            }
            // TODO: read @property tags of class
            // TODO: Try to infer the type from default value / constant value
            // Unknown
            return new Types\Mixed_;
        }

        // The node does not have a type
        return null;
    }

    /**
     * Returns the fully qualified name (FQN) that is defined by a node
     * Returns null if the node does not declare any symbol that can be referenced by an FQN
     *
     * @param Node $node
     * @return string|null
     */
    public static function getDefinedFqn($node)
    {
        $parent = $node->parent;
        // Anonymous classes don't count as a definition
        // INPUT                    OUTPUT:
        // namespace A\B;
        // class C { }              A\B\C
        // interface C { }          A\B\C
        // trait C { }              A\B\C
        if (
            $node instanceof PhpParser\ClassLike
        ) {
            $className = (string)$node->getNamespacedName();
            // An (invalid) class declaration without a name will have an empty string as name,
            // but should not define an FQN
            if ($className === '') {
                return null;
            }
            return $className;
        }

        // INPUT                   OUTPUT:
        // namespace A\B;           A\B
        if ($node instanceof Node\Statement\NamespaceDefinition && $node->name instanceof Node\QualifiedName) {
            $name = (string) PhpParser\ResolvedName::buildName($node->name->nameParts, $node->getFileContents());
            return $name === "" ? null : $name;
        }

        // INPUT                   OUTPUT:
        // namespace A\B;
        // function a();           A\B\a();
        if ($node instanceof Node\Statement\FunctionDeclaration) {
            // Function: use functionName() as the name
            $name = (string)$node->getNamespacedName();
            return $name === "" ? null : $name . '()';
        }

        // INPUT                        OUTPUT
        // namespace A\B;
        // class C {
        //   function a () {}           A\B\C->a()
        //   static function b() {}     A\B\C::b()
        // }
        if ($node instanceof Node\MethodDeclaration) {
            // Class method: use ClassName->methodName() as name
            $class = $node->getFirstAncestor(
                Node\Expression\ObjectCreationExpression::class,
                PhpParser\ClassLike::class
            );
            if (!isset($class->name)) {
                // Ignore anonymous classes
                return null;
            }
            if ($node->isStatic()) {
                return (string)$class->getNamespacedName() . '::' . $node->getName() . '()';
            } else {
                return (string)$class->getNamespacedName() . '->' . $node->getName() . '()';
            }
        }

        // INPUT                        OUTPUT
        // namespace A\B;
        // class C {
        //   static $a = 4, $b = 4      A\B\C::$a, A\B\C::$b
        //   $a = 4, $b = 4             A\B\C->$a, A\B\C->$b // TODO verify variable name
        // }
        if (
            ($propertyDeclaration = ParserHelpers\tryGetPropertyDeclaration($node)) !== null &&
            ($classDeclaration =
                $node->getFirstAncestor(
                    Node\Expression\ObjectCreationExpression::class,
                    PhpParser\ClassLike::class
                )
            ) !== null && isset($classDeclaration->name)) {
            $name = $node->getName();
            if ($propertyDeclaration->isStatic()) {
                // Static Property: use ClassName::$propertyName as name
                return (string)$classDeclaration->getNamespacedName() . '::$' . $name;
            }

            // Instance Property: use ClassName->propertyName as name
            return (string)$classDeclaration->getNamespacedName() . '->' . $name;
        }

        // INPUT                        OUTPUT
        // namespace A\B;
        // const FOO = 5;               A\B\FOO
        // class C {
        //   const $a, $b = 4           A\B\C::$a(), A\B\C::$b
        // }
        if (($constDeclaration = ParserHelpers\tryGetConstOrClassConstDeclaration($node)) !== null) {
            if ($constDeclaration instanceof Node\Statement\ConstDeclaration) {
                // Basic constant: use CONSTANT_NAME as name
                return (string)$node->getNamespacedName();
            }

            // Class constant: use ClassName::CONSTANT_NAME as name
            $classDeclaration = $constDeclaration->getFirstAncestor(
                Node\Expression\ObjectCreationExpression::class,
                PhpParser\ClassLike::class
            );

            if (!isset($classDeclaration->name)) {
                return null;
            }
            return (string)$classDeclaration->getNamespacedName() . '::' . $node->getName();
        }

        if (ParserHelpers\isConstDefineExpression($node)) {
            return $node->argumentExpressionList->children[0]->expression->getStringContentsText();
        }

        return null;
    }

    /**
     * @param DocBlock|null $docBlock
     * @param string|null $variableName
     * @return DocBlock\Tags\Param|null
     */
    private function tryGetDocBlockTagForParameter($docBlock, $variableName)
    {
        if ($docBlock === null || $variableName === null) {
            return null;
        }
        $tags = $docBlock->getTagsByName('param');
        foreach ($tags as $tag) {
            if ($tag->getVariableName() === \ltrim($variableName, "$")) {
                return $tag;
            }
        }
        return null;
    }
}
