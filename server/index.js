const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const { join } = require('node:path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.post('/', (req, res) => {
  console.log(req.body);
  io.emit('message', req.body);
});

io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
    console.log('message: ' + msg);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
