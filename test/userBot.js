const { Message, SnowflakeUtil, Snowflake } = require("discord.js");
const puppeteer = require("puppeteer");
const { DiscordSnowflake } = require('@sapphire/snowflake');
class UserBot {

  /** @type {string} id of the guild that this bot will run in */
  guildId;

  /** @type {string} id of the channel that this bot will run in (can be changed) */
  channelId;

  /** @type {string} userId of the `UserBot`*/
  userId;

  /** @type {string} name of your actual bot (to find the right bot to send slash command to)*/
  botName;
  
  constructor() {}

  /**
   * Finds an element on the page using a CSS selector and clicks it after one second
   * @param {string} selector - The CSS selector of the element to find and click.
   */
  async findAndClick(selector) {
    await this.page.waitForSelector(selector);
    await new Promise((r) => setTimeout(r, 1000));
    await this.page.click(selector);
    await new Promise((r) => setTimeout(r, 1000));
  }

  /**
   * Retrieves the User ID of the currently logged-in user by simulating interaction with the Discord interface.
   * If the User ID is not immediately available, the method opens the Status menu and enables Developer Mode to access the ID.
   * 
   * @returns {Promise<string | null>} The User ID of the current user or `null` if not found.
   */
  async getUserID() {
    //check if Status is already open (and User ID button is available)
    let id = await this.page.evaluate(() => {
      let textElement = [...document.querySelectorAll("*")].find((element) =>
        element.textContent == ("Copy User ID")
      );
      return textElement?.children[0].id
    });

    if (id === undefined) {
      await this.findAndClick('[aria-label="Set Status"]');

      id = await this.page.evaluate(() => {
        let textElement = [...document.querySelectorAll("*")].find((element) =>
          element.textContent == ("Copy User ID")
        );
        return textElement?.children[0].id
      });
    }

    if (id) {

      return id.replace(/\D/g, "");
    }
    return null;

    
  }

  /**
   * Enables Developer Mode in Discord, which is required to copy user IDs.
   * This method navigates to User Settings, opens the Advanced settings, and toggles Developer Mode if it is not already enabled.
   * 
   * @returns {Promise<void>}
   */
  async enableDeveloperMode() {
    // Navigate to User Settings
    await this.page.goto("https://discord.com/channels/@me");

    // Click the User Settings button
    await this.findAndClick('[aria-label="User Settings"]');

    await this.findAndClick('[aria-label="Advanced"]');

    // Check if Developer Mode is enabled
    const developerModeSelector = 'input[type="checkbox"]';
    const isDeveloperModeEnabled = await this.page.evaluate((selector) => {
      const checkbox = document.querySelector(selector);
      return checkbox && checkbox.checked;
    }, developerModeSelector);

    // Enable Developer Mode if not enabled
    if (!isDeveloperModeEnabled) {
      await this.page.click(developerModeSelector);
    }
    await new Promise((r) => setTimeout(r, 1000));

    await this.findAndClick('[aria-label="Close"]');

  }


  /**
   * Logs in to Discord using the provided username and password.
   * The method uses Puppeteer to navigate to the Discord login page, enter the credentials, and wait until the login process is complete.
   * If a user ID is not provided, it retrieves it by enabling Developer Mode if necessary.
   * 
   * @param {string} username - The username or email to log in with.
   * @param {string} password - The password to log in with.
   * @param {string} id - The user ID (optional, will be retrieved if not provided).
   * @param {string} endpoint - The Puppeteer browser endpoint to connect to.
   * @returns {Promise<void>}
   * @throws Will throw an error if the Puppeteer endpoint is not provided or is invalid.
   */
  async login(username, password, id, endpoint) {
    if (endpoint === undefined) {
      throw new Error("Please run puppeteerRunner.js before running any tests.")
    }
    
    try {
      this.browser = await puppeteer.connect({ browserWSEndpoint: endpoint });
    }
    catch (err) {
      console.log("ERROR")
      throw new Error("Endpoint did not work. Run puppeteerRunner.js");
    }

    let [page] = await this.browser.pages();
    this.page = page;

    if (page.url() == "about:blank" || page.url() == "https://discord.com/login") {
    
      const context = this.browser.defaultBrowserContext();
      await context.overridePermissions("https://discord.com", [
        "clipboard-read",
      ]);

      await this.page.goto("https://discord.com/login");
      // Wait for the email input to be visible
      await this.page.waitForSelector('input[name="email"]');

      // Type in the email
      await this.page.type('input[name="email"]', username); // replace with your email

      // Type in the password
      await this.page.type('input[name="password"]', password); // replace with your password

      // Click the login button
      await this.page.click('button[type="submit"]');

      await this.page.waitForFunction(
        'window.location.href === "https://discord.com/channels/@me"',
        { timeout: 0 } // Set timeout to 0 to wait indefinitely
      );
    }

    

    if (id === undefined) {
      if (this.page.url() != `https://discord.com/channels/@me`) {
        await this.page.goto(`https://discord.com/channels/@me`);
      }
      
      let userId = await this.getUserID();
      if (!userId) {
        await this.enableDeveloperMode();
        userId = await this.getUserID();
      }
      this.userId = userId;
      
    } else {
      this.userId = id;
    }
    
    console.log("userBot login:", username, this.userId);
  }

  /**
   * Sends a message to a specified channel in a guild.
   * 
   * @param {string} content - The message content to send.
   * @param {string} [guildId=this.guildId] - The ID of the guild to send the message in.
   * @param {string} [channelId=this.channelId] - The ID of the channel to send the message in.
   * @returns {Promise<void>}
   */
  async sendMessage(content, guildId=this.guildId, channelId=this.channelId) {
    if (this.page.url() != `https://discord.com/channels/${guildId}/${channelId}`) {
      await this.page.goto(`https://discord.com/channels/${guildId}/${channelId}`);
    }

    // Wait for the message input area to load
    await this.page.waitForSelector('div[role="textbox"]');

    await new Promise(r => setTimeout(r, 2000))

    await this.page.type('div[role="textbox"]', content);
    await this.page.keyboard.press("Enter");
  }

  /**
   * Sends a slash command to the main bot in the specified channel.
   * The method navigates to the channel, types the command, and selects the correct bot from the list.
   * 
   * @param {string} commandName - The name of the command to send.
   * @param {string} [botName=this.botName] - The name of the bot to send the command to.
   * @param {string} [guildId=this.guildId] - The ID of the guild to send the command in.
   * @param {string} [channelId=this.channelId] - The ID of the channel to send the command in.
   * @returns {Promise<void>}
   */
  async sendCommand(commandName, botName=this.botName, guildId=this.guildId, channelId=this.channelId) {
    console.log(guildId, channelId);
    if (this.page.url() != `https://discord.com/channels/${guildId}/${channelId}`) {
      await this.page.goto(`https://discord.com/channels/${guildId}/${channelId}`);
    }

    // Wait for the message input area to load
    await this.page.waitForSelector('div[role="textbox"]');

    await this.page.type('div[role="textbox"]', "/" + commandName);
    await new Promise((r) => setTimeout(r, 2000));

    while (true) {
      let currentBotName = await this.page.evaluate(() => {
        return document.querySelector('div[aria-selected=true]').children[0].children[0].children[2].textContent;
      });

      if (currentBotName == botName) {
        break;
      } else {
        await this.page.keyboard.press("ArrowDown");
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    await this.page.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 1000));
    await this.page.keyboard.press("Enter");

  }

  /**
   * Clicks a button in a specified message.
   * The method finds the button by name within the message and simulates a click.
   * 
   * @param {string} buttonName - The name of the button to click.
   * @param {Message} message - The Discord message object containing the button.
   * @returns {Promise<void>}
   */
  async clickButton(buttonName, message) {
    
    if (this.page.url() != `https://discord.com/channels/${message.guildId}/${message.channelId}`) {
      await this.page.goto(`https://discord.com/channels/${message.guildId}/${message.channelId}`);
    }
    
    await this.page.waitForSelector(`[id="message-accessories-${message.id}"]`, {timeout: 5000})
    await new Promise((r) => setTimeout(r, 2000));

    //find what "row" the button is on (embeds count as rows too)
    let button = await this.page.evaluateHandle((message,buttonName) => {
      let accs = document.getElementById(`message-accessories-${message.id}`)
      for (var i=0;i<accs.children.length; i++) {
        if (accs.children[i].className.startsWith("container")) {
          let buttons = accs.children[i].children[0].children[0];
          let found = Array.from(buttons.children).find(button => button.textContent == buttonName);
          if (found) {return found}
        }
      }
      return undefined
    }, message, buttonName);

    if (! button) {
      throw new Error("Button not found.")
    }

    await new Promise((r) => setTimeout(r, 1000));
    await button.click()

  }

  /**
   * Adds a reaction to a specified message using the provided emoji name.
   * The method navigates to the message, opens the reaction picker, and adds the reaction.
   * 
   * @param {string} emojiName - The name of the emoji to react with.
   * @param {Message} message - The Discord message object to add the reaction to.
   * @returns {Promise<void>}
   */
  async addReaction(emojiName, message) {
    if (this.page.url() != `https://discord.com/channels/${message.guildId}/${message.channelId}`) {
      await this.page.goto(`https://discord.com/channels/${message.guildId}/${message.channelId}`);
    }

    let messageElement = await this.page.waitForSelector(`#chat-messages-${message.channelId}-${message.id} > :first-child`);
    await new Promise((r) => setTimeout(r, 1000));
    //NEED TO MFING SCROLL BECAUSE DISCORD DOES NOT LET YOU CLICK IMMEDIATELY AFTER SCROLLING ELKDJSAKJFDIFOJ
    await this.page.hover(`#chat-messages-${message.channelId}-${message.id} > :first-child`)
    await new Promise((r) => setTimeout(r, 1000));
    await messageElement.click({button: 'right'});
    let addReactionButton = await this.page.waitForSelector(`#message-add-reaction`,{timeout: 5000});
    await new Promise((r) => setTimeout(r, 1000));
    await addReactionButton.click();

    await new Promise((r) => setTimeout(r, 1000));
    await this.page.keyboard.type(emojiName);
    await this.page.keyboard.press("Enter");
    

  }
}

module.exports = UserBot;
