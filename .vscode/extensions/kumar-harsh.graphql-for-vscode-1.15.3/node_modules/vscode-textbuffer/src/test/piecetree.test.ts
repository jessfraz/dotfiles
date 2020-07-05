import { PieceTreeTextBufferBuilder, DefaultEndOfLine } from '../index';

describe('random tests', () => {
    it('random insert delete', () => {
        let pieceTreeTextBufferBuilder = new PieceTreeTextBufferBuilder();
        pieceTreeTextBufferBuilder.acceptChunk('abc\n');
        pieceTreeTextBufferBuilder.acceptChunk('def');
        let pieceTreeFactory = pieceTreeTextBufferBuilder.finish(true);
        let pieceTree = pieceTreeFactory.create(DefaultEndOfLine.LF);

        expect(pieceTree.getLineCount()).toEqual(2);
        expect(pieceTree.getLineContent(1)).toEqual('abc');
        expect(pieceTree.getLineContent(2)).toEqual('def');

        pieceTree.insert(1, '+');
        expect(pieceTree.getLineCount()).toEqual(2);
        expect(pieceTree.getLineContent(1)).toEqual('a+bc');
        expect(pieceTree.getLineContent(2)).toEqual('def');
    });
});
