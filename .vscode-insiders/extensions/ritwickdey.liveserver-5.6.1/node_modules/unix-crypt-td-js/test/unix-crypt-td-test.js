/** Tests for Unix Crypt **/

$(function() {
    test("Equivalent output to crypt(3)", function() {
        strictEqual(unixCryptTD('foo', 'ba'), 'ba4TuD1iozTxw');
        strictEqual(unixCryptTD('random long string', 'hi'), 'hib8W/d4WOlU.');
        strictEqual(unixCryptTD('foob', 'ar'), 'arlEKn0OzVJn.');
        strictEqual(unixCryptTD('Hello World! This is Unix crypt(3)!', 'ux'),
                    'uxNS5oJDUz4Sc');
    });
});;
