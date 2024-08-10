
- **Create basic connect4 game**
    - **Simple 6 x 7** 
    - **Customization (players, size, emojis)**
    - **Change player amount check to the start button, not at the collection end**
    - **Implement max players**
- **Extend to all games (GameManager)**
- **Host online**
    - **Set up google cloud compute**
    - **Split prod and testing (I should probably do this earlier)**
    - **~~Automatically reload on github changes~~ too much work lol just git pull & systemctl restart discord-bot**

TODO:

- Create jest tests for all current code
    - **figure out how to detect ephemeral responses (I don't think they appear in cache)**
    - **make username / password read from config**
    - **make seeing client output results simpler**
    - **split actions table**
    - **create a waitForNextMessage that accepts any message**
    - create extensive game.test.js for Lobby & Options
    - create an extensive connect4.test.js for connect4 specific actions
- Complete Connect4game
    - **Timer in footer**
    - **Lose on timeout**
    - **More than 2 players**
    - QOL:
        - **Make lobby close if not enough players at any point (currently does not work in settings)**
        - **Add stage timers**
        - If time runs out, do not go to next stage and instead quit game
        - Delete input setting messages
        - Delete connect4 move messages
        - Keep timed out players in lobby, but cannot move.
        - Quickstart button in lobby
        - **Not enough players error should show minimum players**
        - Make buttons more clearer (instead of Join / Leave, have a green Join button and a Start (For Owner) button)

    - **Set emojis**
    - Better win screen
    - Gamemodes (blind)
    - Play again button
    - Save Game Settings per channel
- Set up mongodb
    - Create profile / stats
    - Stats for Connect4

Maybe TODO:
- Make mainEmbed title be set automatically when a new stage arrives. 
- Make emoji selection part of GameManager so it can be applied to other games
