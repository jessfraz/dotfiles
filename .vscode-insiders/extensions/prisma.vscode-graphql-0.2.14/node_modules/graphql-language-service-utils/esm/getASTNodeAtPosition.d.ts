import { ASTNode } from 'graphql/language';
import { Position as TPosition } from 'graphql-language-service-types';
export declare function getASTNodeAtPosition(query: string, ast: ASTNode, point: TPosition): ASTNode | undefined;
export declare function pointToOffset(text: string, point: TPosition): number;
//# sourceMappingURL=getASTNodeAtPosition.d.ts.map