### Connect4 Game Actions & Results

| **Stage**   | **Action**             | **Precondition**                 | **Result**                                                |
| ----------- | ---------------------- | -------------------------------- | --------------------------------------------------------- |
| **Lobby**   | Game Command           |                                  | Lobby created with player list and buttons                |
|             | Other Click Join/Leave | User not already in game         | User added to player list                                 |
|             |                        | User already in game             | User removed from player list                             |
|             | Owner Click Join/Leave | At least 2 players               | Owner removed from players, next player becomes owner     |
|             |                        | Only owner in lobby              | Game cancelled due to empty lobby                         |
|             | Owner Click Start      | Minimum players joined           | Transition to Options Stage                               |
|             |                        | Less than minimum players        | Error: "Not enough players to start"                      |
|             | Other Click Start      |                                  | Error: "Not owner of this lobby"                          |
|             | Owner Click Cancel     |                                  | Lobby closed, game not started                            |
|             | Other Click Cancel     |                                  | Error: "Not owner of this lobby"                          |
| **Options** | Options Stage Start    |                                  | Lobby embed title changed, buttons removed.               |
|             |                        |                                  | New message sent with current options list & buttons      |
|             | Owner Click Leave      | Less than minimum players        | Game cancelled due to not enough players.                 |
|             |                        |                                  | Options message deleted                                   |
|             |                        | Still enough players             | Owner removed from players, next player becomes owner     |
|             |                        |                                  | Options message contains new owner                        |
|             | Other Click Leave      | Less than minimum players        | Game cancelled due to not enough players.                 |
|             |                        |                                  | Options message deleted                                   |
|             |                        | Still enough players             | Lobby Updates                                             |
|             | Owner Click Continue   |                                  | Delete message, transition to emojis stage                |
|             | Other Click Continue   |                                  | Error: "Not owner of this lobby"                          |
|             | Owner Click Cancel     |                                  | Lobby closed, option message deleted                      |
|             | Other Click Cancel     |                                  | Error: "Not owner of this lobby"                          |
|             | Owner Types Value      | No option selected + valid value | Owner message deleted, message edited to show option      |
|             |                        | Option selected + valid value    | Owner message deleted, message edited back to option list |
|             |                        | Invalid value                    | Ignore (?)                                                |
|             | Other Types Value      |                                  | Ignore                                                    |
| **End**     | End Stage Start        | Player won                       | Send win embed with buttons, edit lobby title             |
|             |                        | Game drawn                       | Send draw embed with buttons, edit lobby title            |
|             | Click Play Again       |                                  | New game created with person who clicked button as owner  |
