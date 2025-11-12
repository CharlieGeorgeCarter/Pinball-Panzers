# Pinball Panzers - Multiplayer Tank Battle Game

A real-time multiplayer tank battle game built with web technologies.

## Features

- 🎮 Real-time multiplayer gameplay (2 players)
- 🗺️ Procedurally generated maps with different terrain types
- 🎯 Physics-based bullet bouncing (up to 3 bounces)
- 🏆 Best of 3 rounds scoring system
- 📱 Mobile-friendly responsive design
- 🔗 Room-based matchmaking with shareable codes

## How to Play

1. Create a game room and share the room code with a friend
2. Navigate your tank using on-screen controls
3. Fire bullets to hit your opponent
4. Bullets bounce off walls realistically (max 3 bounces)
5. First to hit wins the round
6. First to 3 round wins takes the match!

## Terrain Types

- **Grass**: Normal speed
- **Mud**: Slows tank movement
- **Walls**: Block movement and bounce bullets
- **Obstacles**: Strategic barriers

## Installation

```bash
npm install
npm start
```

Then open your browser to `http://localhost:3000`

## Technology Stack

- Node.js + Express
- Socket.io for real-time communication
- HTML5 Canvas for rendering
- Vanilla JavaScript for game logic
