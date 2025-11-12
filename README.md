# Pinball Panzers - Multiplayer Tank Battle Game

A real-time multiplayer tank battle game built with web technologies.

## Features

- 🎮 **Single Player Mode** - Play against AI with 3 difficulty levels (Easy, Medium, Hard)
- 👥 **Multiplayer Mode** - Real-time gameplay for 2 players
- 🗺️ Procedurally generated maps with different terrain types
- 🎯 Physics-based bullet bouncing (up to 3 bounces)
- 🏆 Best of 3 rounds scoring system
- 📱 Mobile-friendly responsive design
- 🔗 Room-based matchmaking with shareable codes
- 🤖 Intelligent AI opponents with tactical behavior

## How to Play

### Single Player
1. Click "Single Player vs AI"
2. Choose your difficulty:
   - 🟢 **Easy**: Perfect for beginners, slower AI with basic tactics
   - 🟡 **Medium**: Balanced challenge with tactical positioning
   - 🔴 **Hard**: Advanced AI with dodging and precise aim
3. Practice your skills and master the game!

### Multiplayer
1. Create a game room and share the room code with a friend
2. Your friend joins using the 6-character code
3. Battle it out in real-time!

### Controls
- **Mobile**: Left joystick to move, right joystick to rotate, tap FIRE
- **Desktop**: WASD or Arrow keys to move/rotate, Space to shoot
- Navigate your tank and fire bullets to hit your opponent
- Bullets bounce off walls realistically (max 3 bounces)
- First to hit wins the round
- First to 3 round wins takes the match!

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
