# This example requires the 'message_content' intent.

import asyncio
import os

import aiohttp
import discord
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv('TOKEN')

intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f'We have logged in as {client.user}')

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    if message.content.startswith('$hello'):
        await message.channel.send('Hello?')
    
    elif message.content.startswith('$send'):
        await message.channel.send('Sending message to server...')
        text: str = await send_to_server(message.content[1:])
        await message.channel.send(f'Response: {text}')

async def send_to_server(msg: str):
    async with aiohttp.ClientSession() as session:
        async with session.post('http://localhost:3000', data=msg) as response:
            return (await response.text())

if __name__ == "__main__":
    client.run(TOKEN)
