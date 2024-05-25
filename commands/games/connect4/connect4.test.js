const Connect4Game = require('./connect4game.js');

describe('updateLobby function', () => {
    test('empty lobby', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4},["p1","p2"])
        const mockEmbed = {
            setDescription: jest.fn()
        }
        
        c4.updateLobby(game, mockEmbed)
        expect(mockEmbed.setDescription).toHaveBeenCalledWith('');
    })
    test('people joining / leaving', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4},["p1","p2"])
        const mockEmbed = {
            setDescription: jest.fn()
        }

    })
})

describe('checkWin function', () => {

    test('empty board returns -1', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4},["p1","p2"])
        expect(c4.checkWin(game)).toBe(-1);
    })

    test('p1 4 row win', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4},["p1","p2"]);

        game.board[0][0] = game.board[0][1] = game.board[0][2] = game.board[0][3] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    })

    test('p2 4 row win', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4},["p1","p2"]);

        game.board[0][0] = game.board[0][1] = game.board[0][2] = "p2"
        expect(c4.checkWin(game)).toBe(-1);
        game.board[0][3] = "p2";
        expect(c4.checkWin(game)).toBe("p2");
    })

    test('p1 4 column win', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4},["p1","p2"]);

        game.board[0][0] = game.board[1][0] = game.board[2][0] = "p1";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[3][0] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    })

    test('p1 diag win', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4},["p1","p2"]);

        game.board[2][2] = game.board[3][3] = game.board[4][4] = "p1";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[5][5] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    })

    test('different winLength', () => {
        const game = c4.createGame({height:6, width:7, winLength: 5},["p1","p2"]);

        game.board[2][2] = game.board[3][3] = game.board[4][4] = "p1";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[5][5] = "p1";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[1][1] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    })

    test('p2 4 bottom-left to top-right diagonal win', () => {
        const game = c4.createGame({height: 6, width: 7, winLength: 4}, ["p1", "p2"]);
    
        game.board[3][0] = game.board[2][1] = game.board[1][2] = "p2";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[0][3] = "p2";
        expect(c4.checkWin(game)).toBe("p2");
    });
    
    test('win at the boundary of the board', () => {
        const game = c4.createGame({height: 6, width: 7, winLength: 4}, ["p1", "p2"]);
        
        // Winning sequence at the top boundary
        game.board[5][3] = game.board[5][4] = game.board[5][5] = "p1";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[5][6] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    });
    
    test('vertical win at the last column', () => {
        const game = c4.createGame({height: 6, width: 7, winLength: 4}, ["p1", "p2"]);
        
        // Vertical win at the last column
        game.board[0][6] = game.board[1][6] = game.board[2][6] = "p2";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[3][6] = "p2";
        expect(c4.checkWin(game)).toBe("p2");
    });
    
    test('p1 win with different winLength at boundary', () => {
        const game = c4.createGame({height: 6, width: 7, winLength: 5}, ["p1", "p2"]);
        
        game.board[5][2] = game.board[5][3] = game.board[5][4] = game.board[5][5] = "p1";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[5][6] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    });
    
    test('horizontal win spanning across multiple columns', () => {
        const game = c4.createGame({height: 6, width: 7, winLength: 4}, ["p1", "p2"]);
        
        // Winning sequence across multiple columns
        game.board[1][2] = game.board[1][3] = game.board[1][4] = "p1";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[1][5] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    });

    test('empty board returns -1 with 3 players', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4}, ["p1", "p2", "p3"]);
        expect(c4.checkWin(game)).toBe(-1);
    });
    
    test('p3 4 row win', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4}, ["p1", "p2", "p3"]);
    
        game.board[0][0] = game.board[0][1] = game.board[0][2] = game.board[0][3] = "p3";
        expect(c4.checkWin(game)).toBe("p3");
    });
    
    test('p2 4 column win with 3 players', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4}, ["p1", "p2", "p3"]);
    
        game.board[0][0] = game.board[1][0] = game.board[2][0] = "p2";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[3][0] = "p2";
        expect(c4.checkWin(game)).toBe("p2");
    });
    
    test('p1 diagonal win with 3 players', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4}, ["p1", "p2", "p3"]);
    
        game.board[2][2] = game.board[3][3] = game.board[4][4] = "p1";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[5][5] = "p1";
        expect(c4.checkWin(game)).toBe("p1");
    });
    
    test('no win with mixed players', () => {
        const game = c4.createGame({height:6, width:7, winLength: 4}, ["p1", "p2", "p3"]);
    
        game.board[0][0] = "p1";
        game.board[0][1] = "p2";
        game.board[0][2] = "p3";
        game.board[0][3] = "p1";
        expect(c4.checkWin(game)).toBe(-1);
    });
    
    test('p3 wins with different winLength', () => {
        const game = c4.createGame({height:6, width:7, winLength: 5}, ["p1", "p2", "p3"]);
    
        game.board[1][1] = game.board[2][2] = game.board[3][3] = game.board[4][4] = "p3";
        expect(c4.checkWin(game)).toBe(-1);
        game.board[5][5] = "p3";
        expect(c4.checkWin(game)).toBe("p3");
    });
    
    
    
})

