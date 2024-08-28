# TODO:

- Create jest tests for all current code
    - **figure out how to detect ephemeral responses (I don't think they appear in cache)**
    - **make username / password read from config**
    - **make seeing client output results simpler**
    - **split actions table**
    - **create a waitForNextMessage that accepts any message**
    - **create extensive game.test.js for Lobby & Options**
    - create an extensive connect4.test.js for connect4 specific actions
        - idk
- Complete Connect4game
    - **Timer in footer**
    - **Lose on timeout**
    - **More than 2 players**
    - QOL:
        - **Make lobby close if not enough players at any point (currently does not work in settings)**
        - **Add stage timers**
        - **If time runs out, do not go to next stage and instead quit game**
        - **Delete input setting messages**
        - **Delete connect4 move messages**
        - **Keep timed out players in lobby, but cannot move.**
        - **Quickstart button in lobby**
        - **Not enough players error should show minimum players**
        - **Make buttons more clearer (instead of Join / Leave, have a green Join button and a Start (For Owner) button)**

    - **Set emojis**
    - **Better win screen**
    - **Gamemodes**
        - **Colorblind - Piece colors are not shown.**
        - **Blind - No pieces are shown.**
        - **Spin - Either: choose what side you can place the piece from, or gravity rotates in a clockwise direction each turn.**
    - **Play again button**
    - If only one stage before game start, remove "Continue" button.
    - Make gamemode selection better, allow user to browse and see more detail
- Set up mongodb
    - Create profile / stats
        - Total games
        - Total wins
    - Stats for Connect4
        - Total games
        - Total wins
        - Total pieces moved
        - Total potential wins blocked
    - Save Game Settings per channel
        - Need to create channelManager object that will load options from the online database
    - Games object in client (?)

### Maybe TODO:
- Make UserBot actions return the interaction. (Ex. UserBot.sendMessage uses the client.waitForMessageCreate, and returns the message) - Not really needed right now though (?)
- **Make mainEmbed title be set automatically when a new stage arrives.**
- Make emoji selection part of GameManager so it can be applied to other games
- **matchesSimplifiedProperties can accept functions? For example, to allow a message with embed title containing "Hello", can do, matchesSimplifiedProperties({embeds: [{data: {title: (t) => t.includes("Hello")}}]}) - I can see use cases, but it might be better just to expect test.**
- Only one game per channel?    


# TIMELINE:
- Complete all connect4 tests - 13th
- Connect4 gamemodes, QOL, tests - 15th
- Mongodb, stats - 18th
- Add wordgames - 23th
- Go on vacation - 24th-31th
- RELEASE TO PUBLIC - ???



# COMPLETED:

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