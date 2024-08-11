const { Message, SnowflakeUtil, Snowflake } = require("discord.js");
const puppeteer = require("puppeteer");
const { DiscordSnowflake } = require('@sapphire/snowflake');
class UserBot {
  /** id of the guild that this bot will run in*/
  guildId;
  /** id of the channel that this bot will run in (can be changed)*/
  channelId;
  /** userId of the userBot 
   * @type {string}
  */
  userId;
  /** name of your actual bot (to find the right bot to send slash command to)*/
  botName;
  
  constructor() {}

  async findAndClick(selector) {
    await this.page.waitForSelector(selector);
    await new Promise((r) => setTimeout(r, 1000));
    await this.page.click(selector);
    await new Promise((r) => setTimeout(r, 1000));
  }

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

    if (this.page.url() != `https://discord.com/channels/@me`) {
      await this.page.goto(`https://discord.com/channels/@me`);
    }

    if (id === undefined) {
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

  //sends a message
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
   * @param {stirng} buttonName 
   * @param {Message} message 
   * @returns 
   */
  async clickButton(buttonName, message) {
    //find what "row" the button is on (embeds count as rows too)


    
    if (this.page.url() != `https://discord.com/channels/${message.guild.id}/${message.channel.id}`) {
      await this.page.goto(`https://discord.com/channels/${message.guild.id}/${message.channel.id}`);
    }
    
    await this.page.waitForSelector(`[id="message-accessories-${message.id}"]`)
    await new Promise((r) => setTimeout(r, 2000));

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
      console.error("Button not found");
      return;
    }

    await button.click()

  }
}

module.exports = UserBot;
