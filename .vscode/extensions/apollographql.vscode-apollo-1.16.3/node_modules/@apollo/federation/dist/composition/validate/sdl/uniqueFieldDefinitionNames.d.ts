import { ASTVisitor } from 'graphql';
import { SDLValidationContext } from 'graphql/validation/ValidationContext';
export declare function duplicateFieldDefinitionNameMessage(typeName: string, fieldName: string): string;
export declare function existedFieldDefinitionNameMessage(typeName: string, fieldName: string, serviceName: string): string;
export declare function UniqueFieldDefinitionNames(context: SDLValidationContext): ASTVisitor;
//# sourceMappingURL=uniqueFieldDefinitionNames.d.ts.map