<?php
declare(strict_types = 1);

namespace LanguageServer;

use LanguageServerProtocol\{SignatureInformation, ParameterInformation};
use Microsoft\PhpParser\FunctionLike;

class SignatureInformationFactory
{
    /** @var DefinitionResolver */
    private $definitionResolver;

    /**
     * Create a SignatureInformationFactory
     *
     * @param DefinitionResolver $definitionResolver
     */
    public function __construct(DefinitionResolver $definitionResolver)
    {
        $this->definitionResolver = $definitionResolver;
    }

    /**
     * Create a SignatureInformation from a FunctionLike node
     *
     * @param FunctionLike $node Node to create signature information from
     *
     * @return SignatureInformation
     */
    public function create(FunctionLike $node): SignatureInformation
    {
        $params = $this->createParameters($node);
        $label = $this->createLabel($params);
        return new SignatureInformation(
            $label,
            $params,
            $this->definitionResolver->getDocumentationFromNode($node)
        );
    }

    /**
     * Gets parameters from a FunctionLike node
     *
     * @param FunctionLike $node Node to get parameters from
     *
     * @return ParameterInformation[]
     */
    private function createParameters(FunctionLike $node): array
    {
        $params = [];
        if ($node->parameters) {
            foreach ($node->parameters->getElements() as $element) {
                $param = (string) $this->definitionResolver->getTypeFromNode($element);
                $param .= ' ';
                if ($element->dotDotDotToken) {
                    $param .= '...';
                }
                $param .= '$' . $element->getName();
                if ($element->default) {
                    $param .= ' = ' . $element->default->getText();
                }
                $params[] = new ParameterInformation(
                    $param,
                    $this->definitionResolver->getDocumentationFromNode($element)
                );
            }
        }
        return $params;
    }

    /**
     * Creates a signature information label from parameters
     *
     * @param ParameterInformation[] $params Parameters to create the label from
     *
     * @return string
     */
    private function createLabel(array $params): string
    {
        $label = '(';
        if ($params) {
            foreach ($params as $param) {
                $label .= $param->label . ', ';
            }
            $label = substr($label, 0, -2);
        }
        $label .= ')';
        return $label;
    }
}
