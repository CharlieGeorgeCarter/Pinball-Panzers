const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameRoom = require('./gameRoom');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store active game rooms
const gameRooms = new Map();

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Generate random room code
function generateRoomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return gameRooms.has(code) ? generateRoomCode() : code;
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Create a new game room
  socket.on('createRoom', (callback) => {
    const roomCode = generateRoomCode();
    const gameRoom = new GameRoom(roomCode, io);
    gameRooms.set(roomCode, gameRoom);

    socket.join(roomCode);
    gameRoom.addPlayer(socket.id, 1);

    console.log(`Room created: ${roomCode}`);
    callback({ success: true, roomCode, playerNumber: 1 });
  });

  // Create a single player room with AI
  socket.on('createSinglePlayerRoom', (difficulty, callback) => {
    const roomCode = generateRoomCode();
    const gameRoom = new GameRoom(roomCode, io, true, difficulty);
    gameRooms.set(roomCode, gameRoom);

    socket.join(roomCode);
    gameRoom.addPlayer(socket.id, 1);

    // Add AI player
    const aiSocketId = 'AI_' + roomCode;
    gameRoom.addPlayer(aiSocketId, 2, true);

    console.log(`Single player room created: ${roomCode} (${difficulty})`);
    callback({ success: true, roomCode, playerNumber: 1 });

    // Start the game immediately
    gameRoom.startGame();
  });

  // Join an existing room
  socket.on('joinRoom', (roomCode, callback) => {
    const gameRoom = gameRooms.get(roomCode);

    if (!gameRoom) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    if (gameRoom.isFull()) {
      callback({ success: false, error: 'Room is full' });
      return;
    }

    socket.join(roomCode);
    gameRoom.addPlayer(socket.id, 2);

    console.log(`Player joined room: ${roomCode}`);
    callback({ success: true, roomCode, playerNumber: 2 });

    // Start the game when both players are ready
    if (gameRoom.isFull()) {
      gameRoom.startGame();
    }
  });

  // Handle player input
  socket.on('playerInput', (data) => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
      room.handlePlayerInput(socket.id, data);
    }
  });

  // Handle player ready for next round
  socket.on('playerReady', () => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
      room.playerReady(socket.id);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const room = findRoomBySocketId(socket.id);
    if (room) {
      room.handleDisconnect(socket.id);
      // Clean up empty rooms
      if (room.isEmpty()) {
        gameRooms.delete(room.code);
        console.log(`Room deleted: ${room.code}`);
      }
    }
  });
});

// Helper function to find room by socket ID
function findRoomBySocketId(socketId) {
  for (const room of gameRooms.values()) {
    if (room.hasPlayer(socketId)) {
      return room;
    }
  }
  return null;
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
