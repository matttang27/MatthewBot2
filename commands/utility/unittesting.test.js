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

describe("unittesting command", () => {
	it("command interaction, button, and message should work", async () => {
		await bots[0].sendCommand("unittesting");

		let response = await client.waitForMessageCreate({
			embeds: [{ data: { title: "Press button" } }],
			components: [{ components: [{ data: { label: "Button" } }] }],
		});

		await bots[0].clickButton("Button", response);

		response = await client.waitForMessageUpdate({
			content: "Press button",
		});

		await bots[0].clickButton("Button", response);

		let toClick = await client.waitForMessageCreate({
			components: [{ components: [{}, {}] }],
		});

		response = await client.waitForMessageDelete({ id: response.id });

		await bots[0].clickButton(response.id, toClick);

		await client.waitForMessageCreate({ content: "Passed!" }, true);
	}, 100_000);
});
