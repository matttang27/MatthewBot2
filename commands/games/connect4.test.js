const c4 = require('./connect4.js');


describe('checkWin function', () => {

    test('empty board returns -1', () => {
        const game = c4.createGame(6,7,["p1","p2"]);
        expect(c4.checkWin(game)).toBe(-1);
    })

    test('p1 4 row win', () => {
        const game = c4.createGame(6,7,["p1","p2"]);

        game.board[0][0] = game.board[0][1] = game.board[0][2] = game.board[0][3] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    })

    test('p2 4 row win', () => {
        const game = c4.createGame(6,7,["p1","p2"]);

        game.board[0][0] = game.board[0][1] = game.board[0][2] = game.board[0][3] = "p2";
        expect(c4.checkWin(game)).toBe("p2");
    })

    test('p1 4 column win', () => {
        const game = c4.createGame(6,7,["p1","p2"]);

        game.board[0][0] = game.board[1][0] = game.board[2][0] = "p1";
        game.board[3][0] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    })

    test('p1 diag win', () => {
        const game = c4.createGame(6,7,["p1","p2"]);

        game.board[2][2] = game.board[3][3] = game.board[4][4] = "p1";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[5][5] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    })
})