require("module-alias-jest/register");
const MatthewClient = require("@client");
const client = new MatthewClient();

const messages = [
    { content: "test", author: { id: 12345, name: "bot1" }, embeds: [], components: [] },
    { content: "test2", author: { id: 12345, name: "bot1" }, embeds: [], components: [] },
    { content: "test3", author: { id: 123456, name: "bot2" }, embeds: [], components: [] }
]

const embed1 = {
    data: { title: "HELLO", description: "BYE" } 
}
const embed2 = {
	data: { title: "HELLO2", description: "BYE" }
};

const messageEmbeds = [
    { content: "test", author: { id: 12345, name: "bot1" }, embeds: [embed1], components: [] },
    { content: "test", author: { id: 12345, name: "bot2" }, embeds: [embed2], components: [] },
    { content: "test", author: { id: 12345, name: "bot3" }, embeds: [embed1, embed2], components: [] },
    { content: "test", author: { id: 12345, name: "bot4" }, embeds: [embed2, embed1], components: [] },
]


describe("matthewClient's matches simplified properties", () => {
	it("accepts anything if mockObject is empty object", () => {

        //string (unintentional feature)
        expect(
            client.matchesSimplifiedProperties(
                "hello",
                {})
        ).toBe(true);

        //empty object
        expect(
            client.matchesSimplifiedProperties({},{})
        ).toBe(true);

        messages.forEach((m) => {
            expect(
                client.matchesSimplifiedProperties(m,{})
            ).toBe(true);

        })
		
        messageEmbeds.forEach((m) => {
            expect(
                client.matchesSimplifiedProperties(m,{})
            ).toBe(true);
        })
	});
    it("checks property correctly", () => {
        expect(
            client.matchesSimplifiedProperties(
                messages[0],
                {content: "test"})
        ).toBe(true);

        expect(
            client.matchesSimplifiedProperties(
                messages[1],
                {content: "test"})
        ).toBe("content different: real: test2, mock: test");

        expect(
            client.matchesSimplifiedProperties(
                messages[2],
                {content: "test"})
        ).toBe("content different: real: test3, mock: test");
    })

    it("checks nested properties correctly", () => {
        expect(
            client.matchesSimplifiedProperties(
                messages[1],
                {author: {id: 12345}})
        ).toBe(true);

        expect(
            client.matchesSimplifiedProperties(
                messages[2],
                {author: {id: 12345}})
        ).toBe("author.id different: real: 123456, mock: 12345");
    })

    it("make sure all mockObject properties exist in the realObject", () => {
        expect(
            client.matchesSimplifiedProperties(
                messages[0],
                {bananas: 2})
        ).toBe("bananas does not exist in real");

        expect(
            client.matchesSimplifiedProperties(
                messages[0],
                {author: {banana: 2}})
        ).toBe("author.banana does not exist in real");
    })

    describe("arrays", () => {
        it("if mock key is array but real is other type, return error", () => {
            //This may be unexpected behaviour, but I don't think it matters B)
            expect(
                client.matchesSimplifiedProperties({embeds: {}}, {embeds: []})
            ).toBe("embeds has type Object instead of Array");

            //This may be unexpected behaviour, but I don't think it matters B)
            expect(
                client.matchesSimplifiedProperties({embeds: "HELLO"}, {embeds: []})
            ).toBe("embeds has type String instead of Array");
        })
        it("causes error if real key is not array", () => {
            expect(client.matchesSimplifiedProperties({embeds: "HELLO"}, {embeds: [{}]}))
            .toBe("embeds has type String instead of Array");

            //embeds should be array, not object
            expect(client.matchesSimplifiedProperties({embeds: {}}, {embeds: [{}]}))
            .toBe("embeds has type Object instead of Array");
        })
        it("makes sure arrays are same length if strictArray is true", () => {
            expect(client.matchesSimplifiedProperties(
                {embeds: ["HELLO","HI"]}, 
                {embeds: ["HELLO"]},
                true)
            )
            .toBe("embeds has size 2 instead of 1. Turn strictArrays off to allow different lengths.");

            expect(client.matchesSimplifiedProperties(
                {embeds: [{},{}]}, 
                {embeds: []},
                true)
            )
            .toBe("embeds has size 2 instead of 0. Turn strictArrays off to allow different lengths.");

        })
        it('allows extra elements if strictArrays if false', () => {
            expect(client.matchesSimplifiedProperties(
                {embeds: ["HELLO","HI"]}, 
                {embeds: ["HELLO"]})
            )
            .toBe(true);

            expect(client.matchesSimplifiedProperties(
                {embeds: [{},{}]}, 
                {embeds: []})
            )
            .toBe(true);
        })
        it('checks each element, and correctly prints out index if error', () => {

            expect(client.matchesSimplifiedProperties(
                messageEmbeds[0], 
                {embeds: [{data: {title: "HELLO"}}]})
            ).toBe(true);

            expect(client.matchesSimplifiedProperties(
                messageEmbeds[1], 
                {embeds: [{data: {title: "HELLO"}}]})
            ).toBe("embeds[0].data.title different: real: HELLO2, mock: HELLO");

            expect(client.matchesSimplifiedProperties(
                messageEmbeds[2], 
                {embeds: [{data: {title: "HELLO"}}]})
            ).toBe(true);

            //wrong order
            expect(client.matchesSimplifiedProperties(
                messageEmbeds[3], 
                {embeds: [{data: {title: "HELLO"}}]})
            ).toBe("embeds[0].data.title different: real: HELLO2, mock: HELLO");
        })
    })
});
