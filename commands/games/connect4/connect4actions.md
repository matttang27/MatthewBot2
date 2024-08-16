### Connect4 Game Actions & Results

Lobby, Options, End Stage are contained in gameactions.md

| **Stage**  | **Action**          | **Precondition**        | **Result**                                          |
| ---------- | ------------------- | ----------------------- | --------------------------------------------------- |
| **Emojis** | Emojis Stage Start  |                         | Lobby embed title changed, default emojis set       |
|            |                     |                         | New message sent with current emojis list & buttons |
|            | Player reacts emoji | Non-unique emoji        | Error: "Pick an unique emoji"                       |
|            | Player reacts emoji | Banned emoji            | Error: "That emoji is not allowed"                  |
|            |                     | Valid emoji             | Update player emoji, edit message                   |
|            | **Same buttons**    |                         |
| **Game**   | Game Stage Start    |                         | Lobby embed title changed                           |
|            |                     |                         | New message sent with empty board asking p1 to play |
|            | Current plays       | Column is full          | Move deleted, Error: "Column is full"               |
|            |                     | No win detected         | Move deleted, Next turn, new message sent           |
|            |                     | Win detected            | Move deleted, Player wins, Game goes to end stage   |
|            |                     | Board full              | Move deleted, Draw, Game goes to end stage          |
|            | Current times out   | At least 3 players left | Player loses and can no longer play, next turn      |
|            |                     |                         | All of timed out player pieces turn black           |
|            |                     | Only 2 players          | Remaining player wins, Game goes to end stage       |

