
- **Create basic connect4 game**
    - **Simple 6 x 7** 
    - **Customization (players, size, emojis)**
    - **Change player amount check to the start button, not at the collection end**
    - **Implement max players**
- **Extend to all games (GameManager)**

TODO:

- **Create jest tests for all current code**
    - **figure out how to detect ephemeral responses (I don't think they appear in cache)**
    - **make username / password read from config**
    - **make seeing client output results simpler**
    - **create an extensive connect4.test.js**
- Complete Connect4game
    - **Timer in footer**
    - **Lose on timeout**
    - **More than 2 players**
    - QOL:
        - **Make lobby close if not enough players at any point (currently does not work in settings)**
        - Add stage timers
        - If time runs out, do not go to next stage and instead quit game
        - Delete input setting messages
        - Delete connect4 move messages
        - Keep timed out players in lobby, but cannot move.
        - Quickstart button in loby

    - **Set emojis**
    - Better win screen
    - Gamemodes (blind)
    - Play again button
    - Save Game Settings per channel
- Set up mongodb
    - Create profile / stats
    - Stats for Connect4
- Split prod and testing (I should probably do this earlier)