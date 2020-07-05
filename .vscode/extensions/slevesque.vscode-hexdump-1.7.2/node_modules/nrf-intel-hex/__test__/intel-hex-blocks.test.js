'use strict';



// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength,padString) {
        targetLength = targetLength>>0; //floor if number or convert non-number to 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0,targetLength) + String(this);
        }
    };
}

// Fetch the "MemoryMap" if running on Node.
// When running on a browser, the "MemoryMap" global is already define thanks to the IIFE.
if (typeof MemoryMap === 'undefined') {
    var MemoryMap = require('../intel-hex.cjs');
}

describe("MemoryMap utilities", function() {

    describe("overlapMemoryMaps", function() {
        describe('no-overlap idempotence', ()=>{
            it('one MemoryMap of one block', () => {
                let bytes = (new Uint8Array(16)).map((i,j)=>j+16);

                let blocks = new MemoryMap([[128, bytes]]);

                let blockSets = new Map([['foo', blocks]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps.size).toBe(1);
                expect(overlaps.has(128)).toBe(true);
                expect(overlaps.get(128).length).toBe(1);
                expect(overlaps.get(128)[0][0]).toBe('foo');
                expect(overlaps.get(128)[0][1]).toEqual(bytes);
            });

            it('one MemoryMap of two blocks', () => {
                let bytes1 = (new Uint8Array(16)).map((i,j)=>j+16);
                let bytes2 = (new Uint8Array(16)).map((i,j)=>j+128);

                let blocks = new MemoryMap([[0x00B8, bytes1], [0xFC00, bytes2]]);

                let blockSets = new Map([['foo', blocks]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps.size).toBe(2);
                expect(overlaps.has(0x00B8)).toBe(true);
                expect(overlaps.get(0x00B8).length).toBe(1);
                expect(overlaps.get(0x00B8)[0][0]).toBe('foo');
                expect(overlaps.get(0x00B8)[0][1]).toEqual(bytes1);
                expect(overlaps.has(0xFC00)).toBe(true);
                expect(overlaps.get(0xFC00).length).toBe(1);
                expect(overlaps.get(0xFC00)[0][0]).toBe('foo');
                expect(overlaps.get(0xFC00)[0][1]).toEqual(bytes2);
            });

            it('two MemoryMaps of one block', () => {
                let bytes1 = (new Uint8Array(16)).map((i,j)=>j+16);
                let bytes2 = (new Uint8Array(16)).map((i,j)=>j+128);

                let blocks1 = new MemoryMap([[0x00B8, bytes1]]);
                let blocks2 = new MemoryMap([[0xFC00, bytes2]]);

                let blockSets = new Map([['foo', blocks1], ['bar', blocks2]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps.size).toBe(2);
                expect(overlaps.has(0x00B8)).toBe(true);
                expect(overlaps.get(0x00B8).length).toBe(1);
                expect(overlaps.get(0x00B8)[0][0]).toBe('foo');
                expect(overlaps.get(0x00B8)[0][1]).toEqual(bytes1);
                expect(overlaps.has(0xFC00)).toBe(true);
                expect(overlaps.get(0xFC00).length).toBe(1);
                expect(overlaps.get(0xFC00)[0][0]).toBe('bar');
                expect(overlaps.get(0xFC00)[0][1]).toEqual(bytes2);
            });

            it('two MemoryMaps of two blocks', () => {
                let bytes1 = (new Uint8Array(16)).map((i,j)=>j+16);
                let bytes2 = (new Uint8Array(16)).map((i,j)=>j+128);
                let bytes3 = (new Uint8Array(128)).map((i,j)=>j);
                let bytes4 = (new Uint8Array(128)).map((i,j)=>j+99);

                let blocks1 = new MemoryMap([[0x00B8, bytes1], [0x1080, bytes2]]);
                let blocks2 = new MemoryMap([[0x0A20, bytes3], [0xFC00, bytes4]]);

                let blockSets = new Map([['foo', blocks1], ['bar', blocks2]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps.size).toBe(4);
                expect(overlaps.has(0x00B8)).toBe(true);
                expect(overlaps.get(0x00B8).length).toBe(1);
                expect(overlaps.get(0x00B8)[0][0]).toBe('foo');
                expect(overlaps.get(0x00B8)[0][1]).toEqual(bytes1);
                expect(overlaps.has(0x0A20)).toBe(true);
                expect(overlaps.get(0x0A20).length).toBe(1);
                expect(overlaps.get(0x0A20)[0][0]).toBe('bar');
                expect(overlaps.get(0x0A20)[0][1]).toEqual(bytes3);
                expect(overlaps.has(0x1080)).toBe(true);
                expect(overlaps.get(0x1080).length).toBe(1);
                expect(overlaps.get(0x1080)[0][0]).toBe('foo');
                expect(overlaps.get(0x1080)[0][1]).toEqual(bytes2);
                expect(overlaps.has(0xFC00)).toBe(true);
                expect(overlaps.get(0xFC00).length).toBe(1);
                expect(overlaps.get(0xFC00)[0][0]).toBe('bar');
                expect(overlaps.get(0xFC00)[0][1]).toEqual(bytes4);
            });
        });

        describe('two overlapping MemoryMaps', ()=>{
            it('two MemoryMaps fully overlapping', () => {
                let bytes = (new Uint8Array(16)).map((i,j)=>j+16);

                let blocks1 = new MemoryMap([[128, bytes]]);
                let blocks2 = new MemoryMap([[128, bytes]]);

                let blockSets = new Map([['foo', blocks1], ['bar', blocks2]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps.size).toBe(1);
                expect(overlaps.has(128)).toBe(true);
                expect(overlaps.get(128).length).toBe(2);
                expect(overlaps.get(128)[0][0]).toBe('foo');
                expect(overlaps.get(128)[0][1]).toEqual(bytes);
                expect(overlaps.get(128)[1][0]).toBe('bar');
                expect(overlaps.get(128)[1][1]).toEqual(bytes);
            });

            it('two MemoryMaps overlapping at the start', () => {
                let bytes1 = (new Uint8Array(16)).map((i,j)=>j+16);
                let bytes2 = (new Uint8Array(32)).map((i,j)=>j+48);

                let blocks1 = new MemoryMap([[128, bytes1]]);
                let blocks2 = new MemoryMap([[128, bytes2]]);

                let blockSets = new Map([['foo', blocks1], ['bar', blocks2]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps.size).toBe(2);
                expect(overlaps.has(128)).toBe(true);
                expect(overlaps.get(128).length).toBe(2);
                expect(overlaps.get(128)[0][0]).toBe('foo');
                expect(overlaps.get(128)[0][1]).toEqual(bytes1);
                expect(overlaps.get(128)[1][0]).toBe('bar');
                expect(overlaps.get(128)[1][1]).toEqual(bytes2.subarray(0, 16));
                expect(overlaps.has(128+16)).toBe(true);
                expect(overlaps.get(128+16).length).toBe(1);
                expect(overlaps.get(128+16)[0][0]).toBe('bar');
                expect(overlaps.get(128+16)[0][1]).toEqual(bytes2.subarray(16, 32));
            });

            it('two MemoryMaps overlapping at the end', () => {
                let bytes1 = (new Uint8Array(32)).map((i,j)=>j+48);
                let bytes2 = (new Uint8Array(16)).map((i,j)=>j+16);

                let blocks1 = new MemoryMap([[128, bytes1]]);
                let blocks2 = new MemoryMap([[128 + 16, bytes2]]);

                let blockSets = new Map([['foo', blocks1], ['bar', blocks2]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps.size).toBe(2);
                expect(overlaps.has(128)).toBe(true);
                expect(overlaps.get(128).length).toBe(1);
                expect(overlaps.get(128)[0][0]).toBe('foo');
                expect(overlaps.get(128)[0][1]).toEqual(bytes1.subarray(0, 16));
                expect(overlaps.has(128+16)).toBe(true);
                expect(overlaps.get(128+16).length).toBe(2);
                expect(overlaps.get(128+16)[0][0]).toBe('foo');
                expect(overlaps.get(128+16)[0][1]).toEqual(bytes1.subarray(16, 32));
                expect(overlaps.get(128+16)[1][0]).toBe('bar');
                expect(overlaps.get(128+16)[1][1]).toEqual(bytes2);
            });

            it('two 2-byte MemoryMaps partially overlapping one byte', () => {
                let bytes1 = new Uint8Array([0x80, 0x81]);
                let bytes2 = new Uint8Array(      [0x82, 0x83]);

                let blocks1 = new MemoryMap([[0xFFF0, bytes1]]);
                let blocks2 = new MemoryMap([[0xFFF1, bytes2]]);

                let blockSets = new Map([['foo', blocks1], ['bar', blocks2]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps.size).toBe(3);
                expect(overlaps.has(0xFFF0)).toBe(true);
                expect(overlaps.get(0xFFF0).length).toBe(1);
                expect(overlaps.get(0xFFF0)[0][0]).toBe('foo');
                expect(overlaps.get(0xFFF0)[0][1]).toEqual(new Uint8Array([0x80]));
                expect(overlaps.has(0xFFF1)).toBe(true);
                expect(overlaps.get(0xFFF1).length).toBe(2);
                expect(overlaps.get(0xFFF1)[0][0]).toBe('foo');
                expect(overlaps.get(0xFFF1)[0][1]).toEqual(new Uint8Array([0x81]));
                expect(overlaps.get(0xFFF1)[1][0]).toBe('bar');
                expect(overlaps.get(0xFFF1)[1][1]).toEqual(new Uint8Array([0x82]));
                expect(overlaps.has(0xFFF2)).toBe(true);
                expect(overlaps.get(0xFFF2).length).toBe(1);
                expect(overlaps.get(0xFFF2)[0][0]).toBe('bar');
                expect(overlaps.get(0xFFF2)[0][1]).toEqual(new Uint8Array([0x83]));
            });

            it('one 1-byte block partially overlapping one 3-byte block', () => {
                let bytes1 = new Uint8Array(      [0x83]);
                let bytes2 = new Uint8Array([0x80, 0x81, 0x82]);

                let blocks1 = new MemoryMap([[0xFFF1, bytes1]]);
                let blocks2 = new MemoryMap([[0xFFF0, bytes2]]);

                let blockSets = new Map([['foo', blocks1], ['bar', blocks2]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps.size).toBe(3);
                expect(overlaps.has(0xFFF0)).toBe(true);
                expect(overlaps.get(0xFFF0).length).toBe(1);
                expect(overlaps.get(0xFFF0)[0][0]).toBe('bar');
                expect(overlaps.get(0xFFF0)[0][1]).toEqual(new Uint8Array([0x80]));
                expect(overlaps.has(0xFFF1)).toBe(true);
                expect(overlaps.get(0xFFF1).length).toBe(2);
                expect(overlaps.get(0xFFF1)[0][0]).toBe('foo');
                expect(overlaps.get(0xFFF1)[0][1]).toEqual(new Uint8Array([0x83]));
                expect(overlaps.get(0xFFF1)[1][0]).toBe('bar');
                expect(overlaps.get(0xFFF1)[1][1]).toEqual(new Uint8Array([0x81]));
                expect(overlaps.has(0xFFF2)).toBe(true);
                expect(overlaps.get(0xFFF2).length).toBe(1);
                expect(overlaps.get(0xFFF2)[0][0]).toBe('bar');
                expect(overlaps.get(0xFFF2)[0][1]).toEqual(new Uint8Array([0x82]));
            });
        });

        describe('three overlapping blocksets', ()=>{
            it('three 3-byte blocks offset by 1', () => {
                let bytes1 = new Uint8Array([0x80, 0x81, 0x82]);
                let bytes2 = new Uint8Array(      [0x90, 0x91, 0x92]);
                let bytes3 = new Uint8Array(            [0xA0, 0xA1, 0xA2]);

                let blocks1 = new MemoryMap([[0xFFF0, bytes1]]);
                let blocks2 = new MemoryMap([[0xFFF1, bytes2]]);
                let blocks3 = new MemoryMap([[0xFFF2, bytes3]]);

                let blockSets = new Map([['foo', blocks1], ['bar', blocks2], ['quux', blocks3]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps).toEqual(new Map([
                    [0xFFF0, [['foo', new Uint8Array([0x80])]]],
                    [0xFFF1, [['foo', new Uint8Array([0x81])], ['bar', new Uint8Array([0x90])]]],
                    [0xFFF2, [['foo', new Uint8Array([0x82])], ['bar', new Uint8Array([0x91])], ['quux', new Uint8Array([0xA0])]]],
                    [0xFFF3, [['bar', new Uint8Array([0x92])], ['quux', new Uint8Array([0xA1])]]],
                    [0xFFF4, [['quux', new Uint8Array([0xA2])]]],
                ]));

            });

            it('three 3-byte blocks offset by 2', () => {
                let bytes1 = new Uint8Array([0x80, 0x81, 0x82]);
                let bytes2 = new Uint8Array(            [0x90, 0x91, 0x92]);
                let bytes3 = new Uint8Array(                        [0xA0, 0xA1, 0xA2]);

                let blocks1 = new MemoryMap([[0xFFF0, bytes1]]);
                let blocks2 = new MemoryMap([[0xFFF2, bytes2]]);
                let blocks3 = new MemoryMap([[0xFFF4, bytes3]]);

                let blockSets = new Map([['foo', blocks1], ['bar', blocks2], ['quux', blocks3]]);

                let overlaps = MemoryMap.overlapMemoryMaps(blockSets);

                expect(overlaps).toEqual(new Map([
                    [0xFFF0, [['foo', new Uint8Array([0x80, 0x81])]]],
                    [0xFFF2, [['foo', new Uint8Array([0x82])], ['bar', new Uint8Array([0x90])]]],
                    [0xFFF3, [['bar', new Uint8Array([0x91])]]],
                    [0xFFF4, [['bar', new Uint8Array([0x92])], ['quux', new Uint8Array([0xA0])]]],
                    [0xFFF5, [['quux', new Uint8Array([0xA1, 0xA2])]]],
                ]));

            });

        });
    });

    describe("flattenOverlaps", ()=>{

        it('flattens five overlaps', ()=>{
            const overlaps = new Map([
                [0xFFF0, [['foo', new Uint8Array([0x80])]]],
                [0xFFF1, [['foo', new Uint8Array([0x81])], ['bar', new Uint8Array([0x90])]]],
                [0xFFF2, [['foo', new Uint8Array([0x82])], ['bar', new Uint8Array([0x91])], ['quux', new Uint8Array([0xA0])]]],
                [0xFFF3, [['bar', new Uint8Array([0x92])], ['quux', new Uint8Array([0xA1])]]],
                [0xFFF4, [['quux', new Uint8Array([0xA2])]]],
            ]);

            const flattened = MemoryMap.flattenOverlaps(overlaps);

            expect(flattened).toEqual(new MemoryMap([
                [0xFFF0, new Uint8Array([0x80])],
                [0xFFF1, new Uint8Array([0x90])],
                [0xFFF2, new Uint8Array([0xA0])],
                [0xFFF3, new Uint8Array([0xA1])],
                [0xFFF4, new Uint8Array([0xA2])]
            ]));

            expect(flattened.join()).toEqual(new MemoryMap([
                [0xFFF0, new Uint8Array([0x80, 0x90, 0xA0, 0xA1, 0xA2])]
            ]));

        });
    });

    describe("paginate", ()=>{

        describe("Input sanity", ()=>{

            it('Throws exception on negative page size', () => {
                const bytes = (new Uint8Array([1]));
                const memMap = new MemoryMap([[0, bytes]]);

                expect(()=>{
                    const pages = memMap.paginate(-8);
                }).toThrow(new Error('Page size must be greater than zero'));

                expect(()=>{
                    const pages = memMap.paginate(0);
                }).toThrow(new Error('Page size must be greater than zero'));
            });
        });

        describe("Single page output", ()=>{

            it('Converts a one-byte block at offset zero into one 8-byte page', ()=>{
                const bytes = (new Uint8Array([1]));
                const memMap = new MemoryMap([[0, bytes]]);

                const pages = memMap.paginate(8);

                expect(pages).toEqual(new MemoryMap([
                    [0, new Uint8Array([0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ])]
                ]));
            });

            it('Converts a one-byte block at offset zero into one 8-byte page with custom padding byte', ()=>{
                const bytes = (new Uint8Array([1]));
                const memMap = new MemoryMap([[0, bytes]]);

                const pages = memMap.paginate(8, 0x55);

                expect(pages).toEqual(new MemoryMap([
                    [0, new Uint8Array([0x01, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55 ])]
                ]));
            });

            it('Converts a one-byte block at offset zero into one 16-byte page', ()=>{
                const bytes = (new Uint8Array([1]));
                const memMap = new MemoryMap([[0, bytes]]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0, new Uint8Array([0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                                        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ])]
                ]));
            });

            it('Converts a 16-byte block at offset zero into one 16-byte page', ()=>{
                const bytes = (new Uint8Array(16)).map((i,j)=>j+1);
                const memMap = new MemoryMap([[0, bytes]]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
                                        0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10])]
                ]));
            });

            it('Converts a one-byte block at high offset into one 8-byte page', ()=>{
                const bytes = (new Uint8Array([1]));
                const memMap = new MemoryMap([[0x654321, bytes]]);

                const pages = memMap.paginate(8);

                expect(pages).toEqual(new MemoryMap([
                    [0x654320, new Uint8Array([0xFF, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ])]
                ]));

            });

            it('Converts a one-byte block at high offset into one 16-byte page', ()=>{
                const bytes = (new Uint8Array([1]));
                const memMap = new MemoryMap([[0x654321, bytes]]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0x654320, new Uint8Array([0xFF, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                                               0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ])]
                ]));

            });

            it('Converts an aligned 16-byte block at high offset into one 16-byte page', ()=>{
                const bytes = (new Uint8Array(16)).map((i,j)=>j+1);
                const memMap = new MemoryMap([[0x654320, bytes]]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0x654320, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
                                               0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10])]
                ]));
            });
        });

        describe("Multiple page output", ()=>{

            it('Converts an misaligned 16-byte block at low offset into two 16-byte pages', ()=>{
                const bytes = (new Uint8Array(16)).map((i,j)=>j+1);
                const memMap = new MemoryMap([[0x04, bytes]]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0x00, new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0x01, 0x02, 0x03, 0x04,
                                           0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C])],
                    [0x10, new Uint8Array([0x0D, 0x0E, 0x0F, 0x10, 0xFF, 0xFF, 0xFF, 0xFF,
                                           0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF])]
                ]));
            });

            it('Converts an misaligned 16-byte block at high offset into two 16-byte pages', ()=>{
                const bytes = (new Uint8Array(16)).map((i,j)=>j+1);
                const memMap = new MemoryMap([[0x654324, bytes]]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0x654320, new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0x01, 0x02, 0x03, 0x04,
                                               0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C])],
                    [0x654330, new Uint8Array([0x0D, 0x0E, 0x0F, 0x10, 0xFF, 0xFF, 0xFF, 0xFF,
                                               0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF])]
                ]));
            });

            it('Converts an misaligned 16-byte block at high offset into three 8-byte pages', ()=>{
                const bytes = (new Uint8Array(16)).map((i,j)=>j+1);
                const memMap = new MemoryMap([[0x654324, bytes]]);

                const pages = memMap.paginate(8);

                expect(pages).toEqual(new MemoryMap([
                    [0x654320, new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0x01, 0x02, 0x03, 0x04])],
                    [0x654328, new Uint8Array([0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C])],
                    [0x654330, new Uint8Array([0x0D, 0x0E, 0x0F, 0x10, 0xFF, 0xFF, 0xFF, 0xFF])],
                ]));
            });

        });

        describe("Multiple block input", ()=>{
            it('Merges two contiguous 8-byte blocks into one page at offset zero', ()=>{
                const bytes1 = (new Uint8Array(8)).map((i,j)=>j+1);
                const bytes2 = (new Uint8Array(8)).map((i,j)=>j+9);
                const memMap = new MemoryMap([[0x00, bytes1], [0x08, bytes2]]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
                                        0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10])]
                ]));
            });

            it('Merges two aligned contiguous 8-byte blocks into one page at high offset', ()=>{
                const bytes1 = (new Uint8Array(8)).map((i,j)=>j+1);
                const bytes2 = (new Uint8Array(8)).map((i,j)=>j+9);
                const memMap = new MemoryMap([[0x654320, bytes1], [0x654328, bytes2]]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0x654320, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
                                               0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10])]
                ]));
            });

            it('Merges four sparse 2-byte blocks into one page at offset zero', ()=>{
                const memMap = new MemoryMap([
                    [0x00, new Uint8Array([0x01, 0x02])],
                    [0x03, new Uint8Array([0x03, 0x04])],
                    [0x07, new Uint8Array([0x05, 0x06])],
                    [0x0C, new Uint8Array([0x07, 0x08])],
                ]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0, new Uint8Array([0x01, 0x02, 0xFF, 0x03, 0x04, 0xFF, 0xFF, 0x05,
                                        0x06, 0xFF, 0xFF, 0xFF, 0x07, 0x08, 0xFF, 0xFF])]
                ]));
            });

            it('Merges four sparse 4-byte blocks into two pages at offset zero', ()=>{
                const memMap = new MemoryMap([
                    [0x00, new Uint8Array([0x01, 0x02, 0x03, 0x04])],
                    [0x07, new Uint8Array([0x05, 0x06, 0x07, 0x08])],
                    [0x0D, new Uint8Array([0x09, 0x0A, 0x0B, 0x0C])],
                    [0x18, new Uint8Array([0x0D, 0x0E, 0x0F, 0x10])],
                ]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0x00, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0xFF, 0xFF, 0xFF, 0x05,
                                           0x06, 0x07, 0x08, 0xFF, 0xFF, 0x09, 0x0A, 0x0B])],
                    [0x10, new Uint8Array([0x0C, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                                           0x0D, 0x0E, 0x0F, 0x10, 0xFF, 0xFF, 0xFF, 0xFF])],
                ]));
            });

            it('Merges four sparse 4-byte blocks into two pages at high offset', ()=>{
                const memMap = new MemoryMap([
                    [0x6543200, new Uint8Array([0x01, 0x02, 0x03, 0x04])],
                    [0x6543207, new Uint8Array([0x05, 0x06, 0x07, 0x08])],
                    [0x654320D, new Uint8Array([0x09, 0x0A, 0x0B, 0x0C])],
                    [0x6543218, new Uint8Array([0x0D, 0x0E, 0x0F, 0x10])],
                ]);

                const pages = memMap.paginate(16);

                expect(pages).toEqual(new MemoryMap([
                    [0x6543200, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0xFF, 0xFF, 0xFF, 0x05,
                                           0x06, 0x07, 0x08, 0xFF, 0xFF, 0x09, 0x0A, 0x0B])],
                    [0x6543210, new Uint8Array([0x0C, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                                           0x0D, 0x0E, 0x0F, 0x10, 0xFF, 0xFF, 0xFF, 0xFF])],
                ]));
            });

        });

    });


    describe("getUint32", ()=>{
        it('Returns undefined on empty input blocks', ()=>{
            const blocks = new MemoryMap([]);
            expect(blocks.getUint32(0)).toBe(undefined);
        });

        it('Gets a Uint32 at offset zero', ()=>{
            const blocks = new MemoryMap([
                [0x0, new Uint8Array([0x01, 0x02, 0x03, 0x04])]
            ]);
            expect(blocks.getUint32(0)).toBe(0x01020304);
        });
        it('Gets a little-endian Uint32 at offset zero', ()=>{
            const blocks = new MemoryMap([
                [0x0, new Uint8Array([0x01, 0x02, 0x03, 0x04])]
            ]);
            expect(blocks.getUint32(0, true)).toBe(0x04030201);
        });

        it('Gets a Uint32 at non-zero offset', ()=>{
            const bytes = (new Uint8Array(16)).map((i,j)=>j+1);
            const blocks = new MemoryMap([[0, bytes]]);

            expect(blocks.getUint32(8)).toBe(0x090A0B0C);
        });
        it('Gets a little-endian Uint32 at non-zero offset', ()=>{
            const bytes = (new Uint8Array(16)).map((i,j)=>j+1);
            const blocks = new MemoryMap([[0, bytes]]);

            expect(blocks.getUint32(8, true)).toBe(0x0C0B0A09);
        });

        it('Gets a Uint32 at non-zero offset with several blocks', ()=>{
            const bytes1 = (new Uint8Array(16)).map((i,j)=>j+0x01);
            const bytes2 = (new Uint8Array(16)).map((i,j)=>j+0x11);
            const bytes3 = (new Uint8Array(16)).map((i,j)=>j+0x21);
            const blocks = new MemoryMap([
                [0x1000, bytes1],
                [0x2000, bytes2],
                [0x3000, bytes3]
            ]);

            expect(blocks.getUint32(0x2004)).toBe(0x15161718);
        });
        it('Gets a little-endian Uint32 at non-zero offset with several blocks', ()=>{
            const bytes1 = (new Uint8Array(16)).map((i,j)=>j+0x01);
            const bytes2 = (new Uint8Array(16)).map((i,j)=>j+0x11);
            const bytes3 = (new Uint8Array(16)).map((i,j)=>j+0x21);
            const blocks = new MemoryMap([
                [0x1000, bytes1],
                [0x2000, bytes2],
                [0x3000, bytes3]
            ]);

            expect(blocks.getUint32(0x2004, true)).toBe(0x18171615);
        });

        it('Returns undefined on partial overlaps', ()=>{
            const blocks = new MemoryMap([
                [0x0, new Uint8Array([0x01, 0x02, 0x03, 0x04])],
                [0x4, new Uint8Array([0x05, 0x06, 0x07, 0x08])],

            ]);
            expect(blocks.getUint32(2, true)).toBe(undefined);
        });

    });


    describe("slice", function() {
        it('Length sanity checks', () => {
            let memMap = new MemoryMap([]);
            expect(()=>{
                memMap.slice(0, -10);
            }).toThrow(new Error('Length of the slice cannot be negative'));

            expect(()=>{
                memMap.slice(10, -1);
            }).toThrow(new Error('Length of the slice cannot be negative'));
        });

        it('Empty identity', () => {
            let memMap = new MemoryMap([]);

            expect(memMap.slice(0,16)).toEqual(memMap);
        });

        it('contiguous 16-byte identity', () => {
            let bytes1 = (new Uint8Array(16)).map((i,j)=>j);
            let memMap = new MemoryMap([
                [0x000000, bytes1],
            ]);

            expect(memMap.slice(0, 16)).toEqual(memMap);
            expect(memMap.slice(0, 32)).toEqual(memMap);

            let memMap2 = new MemoryMap([
                [0x000010, bytes1],
            ]);

            expect(memMap2.slice(16, 16)).toEqual(memMap2);
            expect(memMap2.slice(0, 48)).toEqual(memMap2);
        });


        it('zero-length slice is empty', () => {
            let bytes1 = (new Uint8Array(16)).map((i,j)=>j);
            let memMap = new MemoryMap([
                [0x000000, bytes1],
            ]);

            expect(memMap.slice(8, 0)).toEqual(new MemoryMap());
        });


        it('non-contiguous 16-byte identity', () => {
            let bytes1 = (new Uint8Array(4)).map((i,j)=>j);
            let bytes2 = (new Uint8Array(8)).map((i,j)=>j+8);
            let memMap = new MemoryMap([
                [0x000010, bytes1],
                [0x000018, bytes2],
            ]);

            expect(memMap.slice(16, 16)).toEqual(memMap);
            expect(memMap.slice(16, 32)).toEqual(memMap);
            expect(memMap.slice(0, 48)).toEqual(memMap);
        });

        it('Slices a larger stream of bytes', () => {
            let bytes1 = (new Uint8Array(64)).map((i,j)=>j);
            let bytes2 = (new Uint8Array(16)).map((i,j)=>j+8);
            let memMap = new MemoryMap([
                [0x000000, bytes1],
            ]);

            expect(memMap.slice(8, 16)).toEqual(new MemoryMap([[0x08, bytes2]]));
        });


        it('Slices byte blocks at the beginning and end of the slice', () => {
            let bytes1 = (new Uint8Array(16)).map((i,j)=>j);
            let bytes2 = (new Uint8Array(16)).map((i,j)=>j+16);
            let bytes3 = (new Uint8Array(16)).map((i,j)=>j+32);
            let memMap = new MemoryMap([
                [0x000100, bytes1],
                [0x000200, bytes2],
                [0x000300, bytes3],
            ]);

            let memMap2 = new MemoryMap([
                [0x000108, bytes1.subarray(8, 16)],
                [0x000200, bytes2],
                [0x000300, bytes3.subarray(0, 8)],
            ]);

            expect(memMap.slice(0x108, 0x200)).toEqual(memMap2);
        });

        it('Slices part of one block off a multi-block memMap', () => {
            const bytes1 = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
            const bytes5 = new Uint8Array([10,11,12,13]);

            let memMap = new MemoryMap([
                [0x000000, bytes1],
                [0x000100, bytes1],
                [0x000200, bytes1],
            ]);

            const sliced = memMap.slice(0x209, 4);

            expect(sliced).toEqual(new MemoryMap([[0x209, bytes5]]));
        });

    });


    describe("contains", function() {
        const bytes1 = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
        const bytes2 = new Uint8Array([1,2,3,4,5,6,7,8]);
        const bytes3 = new Uint8Array([9,10,11,12,13,14,15,16]);
        const bytes4 = new Uint8Array([1,2,3,4]);
        const bytes5 = new Uint8Array([10,11,12,13]);
        it('Empty is contained', () => {
            let memMap = new MemoryMap([
                [0x000000, bytes1],
            ]);

            expect(memMap.contains(new MemoryMap())).toEqual(true);
        });

        it('Identity is contained', () => {
            let memMap = new MemoryMap([
                [0x000000, bytes1],
            ]);

            expect(memMap.contains(memMap)).toEqual(true);
        });

        it('Subset at the beginning is contained', () => {
            let memMap = new MemoryMap([
                [0x000000, bytes1],
            ]);
            let subMemMap = new MemoryMap([
                [0x000000, bytes2],
            ]);

            expect(memMap.contains(subMemMap)).toEqual(true);
        });

        it('Subset at the end is contained', () => {
            let memMap = new MemoryMap([
                [0x000000, bytes1],
            ]);
            let subMemMap = new MemoryMap([
                [0x000008, bytes3],
            ]);

            expect(memMap.contains(subMemMap)).toEqual(true);
        });

        it('Offset contents are not contained', () => {
            let memMap = new MemoryMap([
                [0x000000, bytes1],
            ]);
            let subMemMap = new MemoryMap([
                [0x000008, bytes1],
            ]);

            expect(memMap.contains(subMemMap)).toEqual(false);
        });

        it('Sparse maps are contained', () => {
            let memMap = new MemoryMap([
                [0x000000, bytes1],
                [0x000100, bytes1],
                [0x000200, bytes1],
            ]);
            let subMemMap = new MemoryMap([
                [0x000008, bytes3],
                [0x000100, bytes4],
                [0x000209, bytes5],
            ]);

            expect(memMap.contains(subMemMap)).toEqual(true);
        });
    });

    describe("slicePad", function() {
        const bytes1 = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
        const bytes2 = new Uint8Array([1,2,3,4]);
        const bytes3 = new Uint8Array([5,6,7,8]);


        it('of an empty map is all padding bytes', () => {
            let memMap = new MemoryMap([]);

            expect(memMap.slicePad(0, 8)).toEqual(Uint8Array.from(
                [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF]
            ));
            expect(memMap.slicePad(0, 16)).toEqual(Uint8Array.from(
                [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
                 0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF]
            ));
            expect(memMap.slicePad(0, 8, 0xA5)).toEqual(Uint8Array.from(
                [0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5]
            ));
        });

        it('out of a memMap\'s data is all padding', () => {
            let memMap = new MemoryMap([
                [0x001000, bytes1],
            ]);

            expect(memMap.slicePad(0, 16)).toEqual(Uint8Array.from(
                [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
                 0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF]
            ));
            expect(memMap.slicePad(8, 16, 0xA5)).toEqual(Uint8Array.from(
                [0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,
                 0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5]
            ));
            expect(memMap.slicePad(0x28000, 16)).toEqual(Uint8Array.from(
                [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
                 0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF]
            ));
            expect(memMap.slicePad(0x28000, 16, 0xA5)).toEqual(Uint8Array.from(
                [0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,
                 0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5]
            ));
        });

        it('of a subset of contiguous data', () => {
            let memMap = new MemoryMap([
                [0x001000, bytes1],
            ]);

            expect(memMap.slicePad(0x1004, 8)).toEqual(Uint8Array.from(
                [5,6,7,8,9,10,11,12]
            ));
        });

        it('at the end of a MemMap\'s data has padding later', () => {
            let memMap = new MemoryMap([
                [0x000000, bytes1],
            ]);

            expect(memMap.slicePad(8, 4)).toEqual(Uint8Array.from(
                [9,10,11,12]
            ));
            expect(memMap.slicePad(8, 8)).toEqual(Uint8Array.from(
                [9,10,11,12,13,14,15,16]
            ));
            expect(memMap.slicePad(8, 16)).toEqual(Uint8Array.from(
                [9,10,11,12,13,14,15,16,
                 0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF]
            ));
            expect(memMap.slicePad(8, 16, 0xA5)).toEqual(Uint8Array.from(
                [9,10,11,12,13,14,15,16,
                 0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5,0xA5]
            ));
            expect(memMap.slicePad(8, 24)).toEqual(Uint8Array.from(
                [9,10,11,12,13,14,15,16,
                 0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
                 0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF]
            ));
        });

        it('at the beginning of a MemMap\'s data has padding before', () => {
            let memMap = new MemoryMap([
                [0x001000, bytes1],
            ]);

            expect(memMap.slicePad(0xFFC, 8)).toEqual(Uint8Array.from(
                [0xFF, 0xFF, 0xFF, 0xFF, 1,2,3,4]
            ));
            expect(memMap.slicePad(0xFF8, 16)).toEqual(Uint8Array.from(
                [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
                 1,2,3,4,5,6,7,8]
            ));
            expect(memMap.slicePad(0xFF0, 24)).toEqual(Uint8Array.from(
                [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
                 0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
                 1,2,3,4,5,6,7,8]
            ));
        });

        it('of several blocks', () => {
            let memMap = new MemoryMap([
                [0x001000, bytes2],
                [0x001006, bytes3],
            ]);

            expect(memMap.slicePad(0x1000 - 8, 16)).toEqual(Uint8Array.from(
                [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,   1,   2,   3,   4,0xFF,0xFF,   5,   6]
            ));
            expect(memMap.slicePad(0x1000 - 4, 16)).toEqual(Uint8Array.from(
                [0xFF,0xFF,0xFF,0xFF,   1,   2,   3,   4,0xFF,0xFF,   5,   6,   7,   8,0xFF,0xFF]
            ));
            expect(memMap.slicePad(0x1000, 16)).toEqual(Uint8Array.from(
                [   1,   2,   3,   4,0xFF,0xFF,   5,   6,   7,   8,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF]
            ));
            expect(memMap.slicePad(0x1002, 16)).toEqual(Uint8Array.from(
                [   3,   4,0xFF,0xFF,   5,   6,   7,   8,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF]
            ));
            expect(memMap.slicePad(0x1004, 8)).toEqual(Uint8Array.from(
                [0xFF,0xFF,   5,   6,   7,   8,0xFF,0xFF]
            ));
            expect(memMap.slicePad(0x1002, 6)).toEqual(Uint8Array.from(
                [   3,   4,0xFF,0xFF,   5,   6]
            ));

        });


    });

});
