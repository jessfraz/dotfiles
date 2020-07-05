import { GraphQLDirective, GraphQLNamedType, GraphQLInputObjectType, DirectiveNode, ScalarTypeDefinitionNode, ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode, UnionTypeDefinitionNode, EnumTypeDefinitionNode, ScalarTypeExtensionNode, ObjectTypeExtensionNode, InterfaceTypeExtensionNode, UnionTypeExtensionNode, EnumTypeExtensionNode, GraphQLField, FieldDefinitionNode } from 'graphql';
export declare const KeyDirective: GraphQLDirective;
export declare const ExtendsDirective: GraphQLDirective;
export declare const ExternalDirective: GraphQLDirective;
export declare const RequiresDirective: GraphQLDirective;
export declare const ProvidesDirective: GraphQLDirective;
export declare const federationDirectives: GraphQLDirective[];
export default federationDirectives;
export declare type ASTNodeWithDirectives = ScalarTypeDefinitionNode | ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | UnionTypeDefinitionNode | EnumTypeDefinitionNode | ScalarTypeExtensionNode | ObjectTypeExtensionNode | InterfaceTypeExtensionNode | UnionTypeExtensionNode | EnumTypeExtensionNode | FieldDefinitionNode;
export declare type GraphQLNamedTypeWithDirectives = Exclude<GraphQLNamedType, GraphQLInputObjectType>;
export declare function gatherDirectives(type: GraphQLNamedTypeWithDirectives | GraphQLField<any, any>): DirectiveNode[];
export declare function typeIncludesDirective(type: GraphQLNamedType, directiveName: string): boolean;
//# sourceMappingURL=directives.d.ts.map