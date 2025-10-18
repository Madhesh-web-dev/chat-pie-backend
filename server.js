const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const chatNamespace = io.of('chat');

let chats = [
  {
    id: 1,
    person: "General",
    messages: {
      id: 1,
      chat: [
        {
          id: 1,
          sendBy: "System",
          message:
            "This is the demo chat for you",
        },
      ],
    },
  },
];;

let users = {};

chatNamespace.on('connection', (socket) => {
  console.log('User connected');
  users[socket.id] = { id: socket.id, name: "Anonymous" };
  socket.broadcast.emit('update_user_count', Object.keys(users).length);
  socket.emit('update_user_count', Object.keys(users).length);

  socket.emit('chat', chats);

  socket.on('message_send', (updatedChat) => {
    socket.broadcast.emit('recieve_message', updatedChat);
    chats = [updatedChat];
  });

  socket.on('create-room', (data) => {
    let newRoom = {
      id: chats.length + 1,
      person: data.roomName,
      password : data.roomPassword,
      messages: {
        id: chats.length + 1,
        chat: [
          {
            id: 1,
            sendBy: "System",
            message:
              "New chat created You can chat now",
          },
        ],
      },
    }
    chats.push(newRoom);
    socket.emit('add-new-room' , newRoom)
  })

  socket.on('disconnect', () => {
    delete users[socket.id];
    console.log('User disconnected', Object.keys(users).length);
    socket.broadcast.emit("user_count", Object.keys(users).length);
  });
});

app.post('/users', (req, res) => {
  res.json(chats);
  console.log('Data sent!');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port : ${PORT}`);
});
