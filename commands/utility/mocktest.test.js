require("module-alias-jest/register");
const MatthewClient = require("@client");
const client = new MatthewClient();

const UserBot = require("@userBot");
const { setup, eachSetup } = require("@testSetup");
beforeAll(async () => {
	bots = await setup(client, 1);
}, 100_000);

beforeEach(async () => {
	await eachSetup(client, bots);
});

describe("mocktest command", () => {
	it("command interaction, button, and message should work", async () => {
		await bots[0].sendCommand("mocktest");

		let response = await client.waitForMessage({
			content: "Press Button",
			components: [{ components: [{ data: { label: "Test" } }] }],
		});

		await bots[0].clickButton("Test", response);

		response = await client.waitForMessage({ content: "type pls" });

		await bots[0].sendMessage("Hello");

		response = await client.waitForMessage({ content: "Hello" });
		expect(response.content).toBe("Hello");
	}, 100_000);
});

/*afterAll(async () => {
	await client.destroy();
})*/