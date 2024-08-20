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

    describe("MatthewClient's matchesSimplifiedProperties with varied predicates", () => {
        it("checks that string functions in mock properties are correctly evaluated", () => {
            // String includes
            expect(
                client.matchesSimplifiedProperties(
                    { text: "Hello, world!" },
                    { text: str => str.includes("world") }
                )
            ).toBe(true);
    
            expect(
                client.matchesSimplifiedProperties(
                    { text: "Goodbye, world!" },
                    { text: str => str.includes("Hello") }
                )
            ).toBe("text function (str => str.includes(\"Hello\")) returned false for Goodbye, world!");
    
            // String startsWith
            expect(
                client.matchesSimplifiedProperties(
                    { text: "Goodbye, world!" },
                    { text: str => str.startsWith("Goodbye") }
                )
            ).toBe(true);
    
            expect(
                client.matchesSimplifiedProperties(
                    { text: "Hello, world!" },
                    { text: str => str.startsWith("Goodbye") }
                )
            ).toBe("text function (str => str.startsWith(\"Goodbye\")) returned false for Hello, world!");
        });
    
        it("checks array length and content with function predicates", () => {
            const arrayTest = [1, 2, 3, 4];
    
            // Array length check
            expect(
                client.matchesSimplifiedProperties(
                    { items: arrayTest },
                    { items: arr => arr.length === 4 }
                )
            ).toBe(true);
    
            expect(
                client.matchesSimplifiedProperties(
                    { items: arrayTest },
                    { items: arr => arr.length === 3 }
                )
            ).toBe("items function (arr => arr.length === 3) returned false for 1,2,3,4");
    
            // Array includes check
            expect(
                client.matchesSimplifiedProperties(
                    { items: arrayTest },
                    { items: arr => arr.includes(3) }
                )
            ).toBe(true);
    
            expect(
                client.matchesSimplifiedProperties(
                    { items: arrayTest },
                    { items: arr => arr.includes(5) }
                )
            ).toBe("items function (arr => arr.includes(5)) returned false for 1,2,3,4");
        });
    
        it("checks nested properties with function predicates", () => {
            const nestedObject = {
                user: {
                    name: "Alice",
                    roles: ["admin", "moderator"],
                    stats: { wins: 10, losses: 5 }
                }
            };
    
            // Check nested string
            expect(
                client.matchesSimplifiedProperties(
                    nestedObject,
                    { user: { name: str => str.startsWith("A") } }
                )
            ).toBe(true);
    
            expect(
                client.matchesSimplifiedProperties(
                    nestedObject,
                    { user: { name: str => str.startsWith("B") } }
                )
            ).toBe("user.name function (str => str.startsWith(\"B\")) returned false for Alice");
    
            // Check nested array length
            expect(
                client.matchesSimplifiedProperties(
                    nestedObject,
                    { user: { roles: arr => arr.length === 2 } }
                )
            ).toBe(true);
    
            expect(
                client.matchesSimplifiedProperties(
                    nestedObject,
                    { user: { roles: arr => arr.length === 3 } }
                )
            ).toBe("user.roles function (arr => arr.length === 3) returned false for admin,moderator");
    
            // Check nested object values
            expect(
                client.matchesSimplifiedProperties(
                    nestedObject,
                    { user: { stats: obj => obj.wins > obj.losses } }
                )
            ).toBe(true);
    
            expect(
                client.matchesSimplifiedProperties(
                    nestedObject,
                    { user: { stats: obj => obj.losses > obj.wins } }
                )
            ).toBe("user.stats function (obj => obj.losses > obj.wins) returned false for [object Object]");
        });
    
        it("handles complex nested structures with multiple function predicates", () => {
            const complexObject = {
                user: {
                    name: "Bob",
                    roles: ["user", "guest"],
                    profile: {
                        age: 25,
                        bio: "Loves coding and music.",
                        stats: { posts: 150, likes: 200 }
                    }
                }
            };
    
            // Complex nested checks
            expect(
                client.matchesSimplifiedProperties(
                    complexObject,
                    {
                        user: {
                            name: str => str.includes("Bob"),
                            roles: arr => arr.length > 1,
                            profile: {
                                age: n => n >= 18,
                                bio: str => str.includes("coding"),
                                stats: obj => obj.likes > obj.posts
                            }
                        }
                    }
                )
            ).toBe(true);
    
            // Check with failing condition
            expect(
                client.matchesSimplifiedProperties(
                    complexObject,
                    {
                        user: {
                            name: str => str.includes("Alice"),
                            profile: {
                                stats: obj => obj.posts > obj.likes
                            }
                        }
                    }
                )
            ).toBe("user.name function (str => str.includes(\"Alice\")) returned false for Bob");
        });
    });
});
