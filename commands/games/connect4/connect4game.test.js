const {
  EmbedBuilder,
  Collection,
  User,
  Client,
  GatewayIntentBits,
} = require("discord.js");
const Connect4Game = require("./connect4game.js");

describe("Connect4Game", () => {
  let game;
  let mockInteraction;

  beforeEach(() => {
    let mockClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
      ],
    });

    mockInteraction = {
      channel: {
        send: jest.fn(),
        awaitMessages: jest.fn(),
      },
      user: {
        id: "12345",
      },
    };

    game = new Connect4Game(mockInteraction);
    game.players = new Collection([
      [
        "12345",
        new User(mockClient, {
          id: 12345,
          username: "person1",
        }),
      ],
      [
        "67890",
        new User(mockClient, {
          id: 67890,
          username: "person2",
        }),
      ],
    ]);
    game.currentOptions = {
      height: 6,
      width: 7,
      winLength: 4,
    };
  });

  describe("constructor", () => {
    it("should initialize properties correctly", () => {
      expect(game.properties.gameName).toBe("Connect4");
      expect(game.properties.minPlayers).toBe(2);
      expect(game.properties.maxPlayers).toBe(6);
      expect(game.turn).toBe(1);
      expect(game.board).toBeUndefined();
    });
  });

  describe("setEmptyBoard", () => {
    it("should initialize an empty board", () => {
      game.setEmptyBoard();
      expect(game.board).toHaveLength(game.currentOptions.height);
      game.board.forEach((row) => {
        expect(row).toHaveLength(game.currentOptions.width);
        row.forEach((cell) => {
          expect(cell).toBe(-1);
        });
      });
    });
  });

  describe("setEmojis", () => {
    it("should assign default emojis to players", () => {
      game.setEmojis();
      expect(game.players.at(0).emoji).toBe(":blue_circle:");
      expect(game.players.at(1).emoji).toBe(":red_circle:");
    });
  });

  describe("printBoard", () => {
    it("should generate a visual representation of the board", () => {
      game.setEmptyBoard();
      game.setEmojis();
      const embed = game.printBoard();
      expect(embed).toBeInstanceOf(EmbedBuilder);
    });
  });

  describe("playGame", () => {
    it("should run the game loop and handle a draw", async () => {
      game.setEmptyBoard();
      game.setEmojis();

      game.turn = game.currentOptions.height * game.currentOptions.width + 1;

      await game.playGame();

      expect(mockInteraction.channel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: [
            expect.objectContaining({
              data: expect.objectContaining({
                title: "Game ended in draw!",
              }),
            }),
          ],
        })
      );
    });

    it("should run the game loop and detect a win", async () => {
      game.setEmptyBoard();
      game.setEmojis();

      // Mocking the winning move
      game.checkWin = jest.fn(() => game.players.at(0));

      // Mocking collected messages
      mockInteraction.channel.awaitMessages.mockResolvedValue({
        first: () => ({ content: "1" }),
      });

      await game.playGame();

      expect(game.checkWin).toHaveBeenCalled();
      expect(mockInteraction.channel.send).toHaveBeenCalled();
    });
  });
});
