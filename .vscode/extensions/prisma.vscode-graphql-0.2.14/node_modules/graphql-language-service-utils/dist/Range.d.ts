import { Location } from 'graphql/language';
import { Range as RangeInterface, Position as PositionInterface } from 'graphql-language-service-types';
export declare class Range implements RangeInterface {
    start: PositionInterface;
    end: PositionInterface;
    constructor(start: PositionInterface, end: PositionInterface);
    setStart(line: number, character: number): void;
    setEnd(line: number, character: number): void;
    containsPosition: (position: PositionInterface) => boolean;
}
export declare class Position implements PositionInterface {
    line: number;
    character: number;
    constructor(line: number, character: number);
    setLine(line: number): void;
    setCharacter(character: number): void;
    lessThanOrEqualTo: (position: PositionInterface) => boolean;
}
export declare function offsetToPosition(text: string, loc: number): Position;
export declare function locToRange(text: string, loc: Location): Range;
//# sourceMappingURL=Range.d.ts.map