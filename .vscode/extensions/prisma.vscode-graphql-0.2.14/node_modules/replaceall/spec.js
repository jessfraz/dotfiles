describe("replaceall", function() {

    it("should have a global replaceall object", function() {
        expect(replaceall).toBeDefined();
    });

    it("should replace single instances", function() {
        var original = "hello world";

        expect(replaceall("hello", "goodbye", original)).toEqual("goodbye world");
        expect(replaceall("w", "underw", original)).toEqual("hello underworld");
    });

    it("should replace multiple instances", function() {
        var original = "hello world goodbye world";

        expect(replaceall("world", "everyone", original)).toEqual("hello everyone goodbye everyone");
        expect(replaceall("l", "z", original)).toEqual("hezzo worzd goodbye worzd");
    });

    it("should replace something with $ (special case)", function() {
        var original = "hello world";

        expect(replaceall("world", "$", original)).toEqual("hello $");
        expect(replaceall("world", "$$", original)).toEqual("hello $$");
    });

    it("should replace special characters", function() {
        var original = "hello world!?!?";

        expect(replaceall("?", "!", original)).toEqual("hello world!!!!");
        expect(replaceall("!", "?", original)).toEqual("hello world????");
    });

    it("should handle replacing with empty strings", function() {
        var original = "hello world again";

        expect(replaceall(" ", "", original)).toEqual("helloworldagain");
    });

    it("should be case sensitive", function() {
        var original = "hello world";

        expect(replaceall("Hello", "Goodbye", original)).toEqual("hello world");
    });
});