<?php

namespace LanguageServer\Factory;

use LanguageServer\Definition;
use LanguageServerProtocol\CompletionItem;
use LanguageServerProtocol\CompletionItemKind;
use LanguageServerProtocol\SymbolKind;

class CompletionItemFactory
{
    /**
     * Creates a CompletionItem for a Definition
     *
     * @param Definition $def
     * @return CompletionItem|null
     */
    public static function fromDefinition(Definition $def)
    {
        $item = new CompletionItem;
        $item->label = $def->symbolInformation->name;
        $item->kind = CompletionItemKind::fromSymbolKind($def->symbolInformation->kind);
        if ($def->type) {
            $item->detail = (string)$def->type;
        } else if ($def->symbolInformation->containerName) {
            $item->detail = $def->symbolInformation->containerName;
        }
        if ($def->documentation) {
            $item->documentation = $def->documentation;
        }
        if ($def->isStatic && $def->symbolInformation->kind === SymbolKind::PROPERTY) {
            $item->insertText = '$' . $def->symbolInformation->name;
        }
        return $item;
    }
}
