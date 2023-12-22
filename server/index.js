import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server(8000, {
  cors: true,
});
const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on('connection', (socket) => {
  console.log(socket.id);
  socket.on('room:join', (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    emailToSocketIdMap.set(socket.id, email);
    socket.join(room);
    io.to(room).emit('user:joined', { email, id: socket.id });
    io.to(socket.id).emit('room:join', data);
  });

  socket.on('user:call', ({ to, offer }) => {
    io.to(to).emit('incomming:call', {
      from: socket.id,
      offer,
    });
  });
  socket.on('call:accepted', ({ to, ans }) => {
    io.to(to).emit('call:accepted', {
      from: socket.id,
      ans,
    });
  });
  socket.on('peer:negotiation:needed', ({ offer, to }) => {
    io.to(to).emit('peer:negotiation:needed', { offer, from: socket.id });
  });
  socket.on('peer:negotiation:done', ({ ans, to }) => {
    io.to(to).emit('peer:negotiation:final', {
      from: socket.id,
      ans,
    });
  });
});
