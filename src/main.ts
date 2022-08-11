import { app, BrowserWindow } from 'electron';

import cors from 'cors';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from "socket.io";
const myApp = express();
const server = http.createServer(myApp);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.setPosition(400, 400);

  win.loadFile('index.html');
  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


myApp.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

myApp.use(cors());

const io = new Server(server, { cors: true });

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.emit("message", { type: "welcome" });

  socket.on("message", (data) => {
    socket.broadcast.emit("message", data);
    if (data.type === 'candidate') {
      return;
    }

    console.log(`>>> Data from ${socket.id} [${data.type}]`);
    const sdp = data.payload?.sdp;
    console.log(sdp);
    console.log('');
  });
});

server.listen(30033, () => {
  console.log('Server listening on port 30033');
});