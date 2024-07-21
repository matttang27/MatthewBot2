### Connect4 Game Actions & Results

Bolded Actions have tests completed

| **Stage**   | **Action**             | **Precondition**                 | **Result**                                                |
| ----------- | ---------------------- | -------------------------------- | --------------------------------------------------------- |
| **Lobby**   | Connect4 Command       |                                  | Lobby created with player list and buttons                |
|             | Owner Click Join/Leave | At least 2 players               | Owner removed from players, next player becomes owner     |
|             |                        | Only owner in lobby              | Game cancelled due to empty lobby                         |
|             | Other Click Join/Leave | User not already in game         | User added to player list                                 |
|             |                        | User already in game             | User removed from player list                             |
|             | Owner Click Start      | Minimum players joined           | Transition to Options Stage                               |
|             |                        | Fewer than minimum players       | Error: "Not enough players to start"                      |
|             | Other Click Start      |                                  | Error: "Not owner of this lobby"                          |
|             | Owner Click Cancel     |                                  | Lobby closed, game not started                            |
|             | Other Click Cancel     |                                  | Error: "Not owner of this lobby"                          |
| **Options** | Options Stage Start    |                                  | Lobby embed title changed, buttons removed.               |
|             |                        |                                  | New message sent with current options list & buttons      |
|             | Owner Click Leave      | Less than 3 players              | Game cancelled due to not enough players.                 |
|             |                        |                                  | Options message deleted                                   |
|             |                        | At least 3 players               | Owner removed from players, next player becomes owner     |
|             |                        |                                  | Options message contains new owner                        |
|             | Other Click Leave      | Less than 3 players              | Game cancelled due to not enough players.                 |
|             |                        |                                  | Options message deleted                                   |
|             |                        | At least 3 players               | Lobby Updates                                             |
|             |                        |                                  | Options message contains new owner                        |
|             | Owner Click Continue   |                                  | Delete message, transition to emojis stage                |
|             | Other Click Continue   |                                  | Error: "Not owner of this lobby"                          |
|             | Owner Click Cancel     |                                  | Lobby closed, game not started                            |
|             | Other Click Cancel     |                                  | Error: "Not owner of this lobby"                          |
|             | Owner Types Value      | No option selected + valid value | Owner message deleted, message edited to show option      |
|             |                        | Option selected + valid value    | Owner message deleted, message edited back to option list |
|             |                        | Invalid value                    | Ignore (?)                                                |
|             | Other Types Value      |                                  | Ignore                                                    |
| **Emojis**  | Emojis Stage Start     |                                  | Lobby embed title changed, default emojis set             |
|             |                        |                                  | New message sent with current emojis list & buttons       |
|             | Player reacts emoji    | Non-unique emoji                 | Error: "Pick an unique emoji"                             |
|             | Player reacts emoji    | Banned emoji                     | Error: "That emoji is not allowed"                        |
|             |                        | Valid emoji                      | Update player emoji, edit message                         |
|             | **Same buttons**       |                                  |
| **Game**    | Game Stage Start       |                                  | Lobby embed title changed                                 |
|             |                        |                                  | New message sent with empty board asking p1 to play       |
|             | Current plays          | Column is full                   | Move deleted, Error: "Column is full"                     |
|             |                        | No win detected                  | Move deleted, Next turn, new message sent                 |
|             |                        | Win detected                     | Move deleted, Player wins, Game goes to end stage         |
|             |                        | Board full                       | Move deleted, Draw, Game goes to end stage stage          |
|             | Current times out      | At least 3 players left          | Player loses and can no longer play, next turn            |
|             |                        |                                  | All of timed out player pieces turn black                 |
|             |                        | Only 2 players                   | Game ends, remaining player wins                          |
| **End**     | End Stage Start        | Player won                       | Send win embed with buttons, edit lobby title             |
|             |                        | Game drawn                       | Send draw embed with buttons, edit lobby title            |
|             | Click Play Again       |                                  | New game created with person who clicked button as owner  |
