import * as cors from 'cors';
import * as express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';

const myApp = express();
const server = http.createServer(myApp);
myApp.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

myApp.use(cors());

const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.emit('message', { type: 'welcome' });

  socket.on('message', (data) => {
    socket.broadcast.emit('message', data);
    if (data.type === 'candidate') {
      return;
    }

    console.log(`>>> Data from ${socket.id} [${data.type}]`);
    const sdp = data.payload?.sdp;
    console.log(sdp);
    console.log('');
  });
});

export default server;
