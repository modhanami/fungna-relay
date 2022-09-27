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
  if (socket.handshake.query.isRelay) {
    console.log(`Relay connected: ${socket.id}`);
    socket.join('relay');
    socket.on('relay:message', (message) => {
      console.log(`Relay sent message: ${message.type}`);
      socket.to(message.clientId).emit('client:message', message);
    });
    return;
  }

  console.log(`Client connected: ${socket.id}`);

  socket.join('client');

  io.to('relay').emit('client:join', { clientId: socket.id });

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id} [${reason}]`);
    io.to('relay').emit('client:leave', { clientId: socket.id });
  });

  socket.on('client:request-offer', () => {
    console.log(`Client requested an offer: ${socket.id}`);
    io.to('relay').emit('client:request-offer', { clientId: socket.id });
  });

  socket.on('client:message', (message) => {
    console.log(`Client sent message: ${socket.id}`);
    io.to('relay').emit('client:message', { clientId: socket.id, message });
  });
});

export function startServer(port = 30033) {
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
