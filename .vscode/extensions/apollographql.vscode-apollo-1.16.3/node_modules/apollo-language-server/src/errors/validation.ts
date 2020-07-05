import {
  specifiedRules,
  NoUnusedFragmentsRule,
  GraphQLError,
  FieldNode,
  ValidationContext,
  GraphQLSchema,
  DocumentNode,
  OperationDefinitionNode,
  TypeInfo,
  FragmentDefinitionNode,
  visit,
  visitWithTypeInfo,
  visitInParallel,
  getLocation,
  InlineFragmentNode,
  Kind,
  isObjectType
} from "graphql";

import { TextEdit } from "vscode-languageserver";

import { ToolError, logError } from "./logger";
import { ValidationRule } from "graphql/validation/ValidationContext";
import { positionFromSourceLocation } from "../utilities/source";
import {
  buildExecutionContext,
  ExecutionContext
} from "graphql/execution/execute";
import { hasClientDirective, simpleCollectFields } from "../utilities/graphql";
import { Debug } from "../utilities";

export interface CodeActionInfo {
  message: string;
  edits: TextEdit[];
}

const specifiedRulesToBeRemoved = [NoUnusedFragmentsRule];

export const defaultValidationRules: ValidationRule[] = [
  NoAnonymousQueries,
  NoTypenameAlias,
  NoMissingClientDirectives,
  ...specifiedRules.filter(rule => !specifiedRulesToBeRemoved.includes(rule))
];

export function getValidationErrors(
  schema: GraphQLSchema,
  document: DocumentNode,
  fragments?: { [fragmentName: string]: FragmentDefinitionNode },
  rules: ValidationRule[] = defaultValidationRules
) {
  const typeInfo = new TypeInfo(schema);
  const context = new ValidationContext(schema, document, typeInfo);

  if (fragments) {
    (context as any)._fragments = fragments;
  }

  const visitors = rules.map(rule => rule(context));
  // Visit the whole document with each instance of all provided rules.
  visit(document, visitWithTypeInfo(typeInfo, visitInParallel(visitors)));
  return context.getErrors();
}

export function validateQueryDocument(
  schema: GraphQLSchema,
  document: DocumentNode
) {
  try {
    const validationErrors = getValidationErrors(schema, document);
    if (validationErrors && validationErrors.length > 0) {
      for (const error of validationErrors) {
        logError(error);
      }
      return Debug.error("Validation of GraphQL query document failed");
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export function NoAnonymousQueries(context: ValidationContext) {
  return {
    OperationDefinition(node: OperationDefinitionNode) {
      if (!node.name) {
        context.reportError(
          new GraphQLError("Apollo does not support anonymous operations", [
            node
          ])
        );
      }
      return false;
    }
  };
}

export function NoTypenameAlias(context: ValidationContext) {
  return {
    Field(node: FieldNode) {
      const aliasName = node.alias && node.alias.value;
      if (aliasName == "__typename") {
        context.reportError(
          new GraphQLError(
            "Apollo needs to be able to insert __typename when needed, please do not use it as an alias",
            [node]
          )
        );
      }
    }
  };
}

function hasClientSchema(schema: GraphQLSchema): boolean {
  const query = schema.getQueryType();
  const mutation = schema.getMutationType();
  const subscription = schema.getSubscriptionType();

  return Boolean(
    (query && query.clientSchema) ||
      (mutation && mutation.clientSchema) ||
      (subscription && subscription.clientSchema)
  );
}

export function NoMissingClientDirectives(context: ValidationContext) {
  const root = context.getDocument();
  const schema = context.getSchema();
  // early return if we don't have any client fields on the schema
  if (!hasClientSchema(schema)) return {};

  // this isn't really execution context, but it does group the fragments and operations
  // together correctly
  // XXX we have a simplified version of this in @apollo/gateway that we could probably use
  // intead of this
  const executionContext = buildExecutionContext(
    schema,
    root,
    Object.create(null),
    Object.create(null),
    undefined,
    undefined,
    undefined
  );
  function visitor(
    node: FieldNode | InlineFragmentNode | FragmentDefinitionNode
  ) {
    // In cases where we are looking at a FragmentDefinition, there is no parent type
    // but instead, the FragmentDefinition contains the type that we can read from the
    // schema
    const parentType =
      node.kind === Kind.FRAGMENT_DEFINITION
        ? schema.getType(node.typeCondition.name.value)
        : context.getParentType();

    const fieldDef = context.getFieldDef();

    // if we don't have a type to check then we can early return
    if (!parentType) return;

    // here we collect all of the fields on a type that are marked "local"
    const clientFields =
      parentType &&
      isObjectType(parentType) &&
      parentType.clientSchema &&
      parentType.clientSchema.localFields;

    // XXXX in the case of a fragment spread, the directive could be on the fragment definition
    let clientDirectivePresent = hasClientDirective(node);

    let message = "@client directive is missing on ";
    let selectsClientFieldSet = false;
    switch (node.kind) {
      case Kind.FIELD:
        // fields are simple because we can just see if the name exists in the local fields
        // array on the parent type
        selectsClientFieldSet = Boolean(
          clientFields && clientFields.includes(fieldDef!.name)
        );
        message += `local field "${node.name.value}"`;
        break;
      case Kind.INLINE_FRAGMENT:
      case Kind.FRAGMENT_DEFINITION:
        // XXX why isn't this type checking below?
        if (Array.isArray(executionContext)) break;

        const fields = simpleCollectFields(
          executionContext as ExecutionContext,
          node.selectionSet,
          Object.create(null),
          Object.create(null)
        );

        // once we have a list of fields on the fragment, we can compare them
        // to the list of types. The fields within a fragment need to be a
        // subset of the overall local fields types
        const fieldNames = Object.entries(fields).map(([name]) => name);
        selectsClientFieldSet = fieldNames.every(
          field => clientFields && clientFields.includes(field)
        );
        message += `fragment ${
          "name" in node ? `"${node.name.value}" ` : ""
        }around local fields "${fieldNames.join(",")}"`;
        break;
    }

    // if the field's parent is part of the client schema and that type
    // includes a field with the same name as this node, we can see
    // if it has an @client directive to resolve locally
    if (selectsClientFieldSet && !clientDirectivePresent) {
      let extensions: { [key: string]: any } | null = null;
      const name = "name" in node && node.name;
      // TODO support code actions for inline fragments, fragment spreads, and fragment definitions
      if (name && name.loc) {
        let { source, end: locToInsertDirective } = name.loc;
        if (
          "arguments" in node &&
          node.arguments &&
          node.arguments.length !== 0
        ) {
          // must insert directive after field arguments
          const endOfArgs = source.body.indexOf(")", locToInsertDirective);
          locToInsertDirective = endOfArgs + 1;
        }
        const codeAction: CodeActionInfo = {
          message: `Add @client directive to "${name.value}"`,
          edits: [
            TextEdit.insert(
              positionFromSourceLocation(
                source,
                getLocation(source, locToInsertDirective)
              ),
              " @client"
            )
          ]
        };
        extensions = { codeAction };
      }

      context.reportError(
        new GraphQLError(message, [node], null, null, null, null, extensions)
      );
    }

    // if we have selected a client field, no need to continue to recurse
    if (selectsClientFieldSet) {
      return false;
    }

    return;
  }
  return {
    InlineFragment: visitor,
    FragmentDefinition: visitor,
    Field: visitor
    // TODO support directives on FragmentSpread
  };
}
