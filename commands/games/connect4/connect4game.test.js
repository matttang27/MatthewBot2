require("module-alias-jest/register");
const Connect4Game = require("./connect4game.js");
/** @type {Connect4Game}*/
let currentGame;

describe("Connect4 Base Game", () => {
  beforeEach(() => {
    currentGame = new Connect4Game({ user: { id: "1" } });
  });

  test("start game should create empty board correctly", () => {
    currentGame.currentOptions = { height: 6, width: 7, winLength: 4 };
    currentGame.players.set("2", { id: "2" });
    currentGame.setEmptyBoard();
    expect(currentGame.board.length).toBe(6);
    expect(currentGame.board[0].length).toBe(7);
  });
});

describe("checkWin function", () => {
  beforeEach(() => {
    currentGame = new Connect4Game({ user: { id: "1" } });
    currentGame.currentOptions = { height: 6, width: 7, winLength: 4 };
    currentGame.players.set("2", { id: "2" });
    currentGame.setEmptyBoard();
  });
  test("empty board returns -1", () => {
    expect(currentGame.checkWin()).toBe(-1);
  });

  test("p1 4 row win", () => {
    currentGame.board[0][0] =
      currentGame.board[0][1] =
      currentGame.board[0][2] =
      currentGame.board[0][3] =
        1;
    expect(currentGame.checkWin()).toBe(1);
  });

  test("p2 4 row win", () => {


    currentGame.board[0][0] =
      currentGame.board[0][1] =
      currentGame.board[0][2] =
        2;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[0][3] = 2;
    expect(currentGame.checkWin()).toBe(2);
  });

  test("p1 4 column win", () => {

    currentGame.board[0][0] =
      currentGame.board[1][0] =
      currentGame.board[2][0] =
        1;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[3][0] = 1;
    expect(currentGame.checkWin()).toBe(1);
  });

  test("p1 diag win", () => {

    currentGame.board[2][2] =
      currentGame.board[3][3] =
      currentGame.board[4][4] =
        1;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[5][5] = 1;
    expect(currentGame.checkWin()).toBe(1);
  });

  test("different winLength", () => {
    currentGame.currentOptions.winLength = 5;
    currentGame.setEmptyBoard();

    currentGame.board[2][2] =
      currentGame.board[3][3] =
      currentGame.board[4][4] =
        1;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[5][5] = 1;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[1][1] = 1;
    expect(currentGame.checkWin()).toBe(1);
  });

  test("p2 4 bottom-left to top-right diagonal win", () => {

    currentGame.board[3][0] =
      currentGame.board[2][1] =
      currentGame.board[1][2] =
        2;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[0][3] = 2;
    expect(currentGame.checkWin()).toBe(2);
  });

  test("win at the boundary of the board", () => {

    // Winning sequence at the top boundary
    currentGame.board[5][3] =
      currentGame.board[5][4] =
      currentGame.board[5][5] =
        1;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[5][6] = 1;
    expect(currentGame.checkWin()).toBe(1);
  });

  test("vertical win at the last column", () => {

    // Vertical win at the last column
    currentGame.board[0][6] =
      currentGame.board[1][6] =
      currentGame.board[2][6] =
        2;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[3][6] = 2;
    expect(currentGame.checkWin()).toBe(2);
  });

  test("p1 win with different winLength at boundary", () => {
    currentGame.currentOptions.winLength = 5;
    currentGame.setEmptyBoard();

    currentGame.board[5][2] =
      currentGame.board[5][3] =
      currentGame.board[5][4] =
      currentGame.board[5][5] =
        1;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[5][6] = 1;
    expect(currentGame.checkWin()).toBe(1);
  });

  test("horizontal win spanning across multiple columns", () => {
    // Winning sequence across multiple columns
    currentGame.board[1][2] =
      currentGame.board[1][3] =
      currentGame.board[1][4] =
        1;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[1][5] = 1;
    expect(currentGame.checkWin()).toBe(1);
  });

  test("empty board returns -1 with 3 players", () => {
    currentGame.players.set(3, {id: 3});
    expect(currentGame.checkWin()).toBe(-1);
  });

  test("p3 4 row win", () => {
    currentGame.players.set(3, {id: 3});

    currentGame.board[0][0] =
      currentGame.board[0][1] =
      currentGame.board[0][2] =
      currentGame.board[0][3] =
        3;
    expect(currentGame.checkWin()).toBe(3);
  });

  test("p2 4 column win with 3 players", () => {
    currentGame.players.set(3, {id: 3});
    

    currentGame.board[0][0] =
      currentGame.board[1][0] =
      currentGame.board[2][0] =
        2;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[3][0] = 2;
    expect(currentGame.checkWin()).toBe(2);
  });

  test("p1 diagonal win with 3 players", () => {
    currentGame.players.set(3, {id: 3});

    currentGame.board[2][2] =
      currentGame.board[3][3] =
      currentGame.board[4][4] =
        1;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[5][5] = 1;
    expect(currentGame.checkWin()).toBe(1);
  });

  test("no win with mixed players", () => {
    currentGame.players.set(3, {id: 3});

    currentGame.board[0][0] = 1;
    currentGame.board[0][1] = 2;
    currentGame.board[0][2] = 3;
    currentGame.board[0][3] = 1;
    expect(currentGame.checkWin()).toBe(-1);
  });

  test("p3 wins with different winLength", () => {
    currentGame.players.set(3, {id: 3});;
    currentGame.currentOptions.winLength = 5;
    currentGame.setEmptyBoard();

    currentGame.board[1][1] =
      currentGame.board[2][2] =
      currentGame.board[3][3] =
      currentGame.board[4][4] =
        3;
    expect(currentGame.checkWin()).toBe(-1);
    currentGame.board[5][5] = 3;
    expect(currentGame.checkWin()).toBe(3);
  });
});

//rotate board tests