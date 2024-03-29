import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const myApp = express();
const server = http.createServer(myApp);
myApp.get('/', (_req, res) => {
  res.send('<h1>Hello world</h1>');
});

myApp.use(cors());

const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on('message', (data) => {
    socket.broadcast.emit('message', data);
    if (data.type === 'candidate') {
      return;
    }

    console.log(`>>> Data from ${socket.id} [${data.type}]`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id} [${reason}]`);
  });
});

export function startServer(port = 30033) {
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
