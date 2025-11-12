class Game {
  constructor() {
    this.socket = null;
    this.roomCode = null;
    this.playerNumber = null;
    this.gameState = null;
    this.renderer = null;
    this.controls = null;
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io();

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
        this.showStatus('Connected', 'success');
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
        this.showStatus('Disconnected', 'error');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.showStatus('Connection Error', 'error');
        reject(error);
      });

      this.socket.on('gameState', (state) => {
        this.gameState = state;
        this.updateGameUI();
      });

      this.socket.on('playerDisconnected', () => {
        this.showStatus('Opponent disconnected', 'error');
        setTimeout(() => {
          this.leaveGame();
        }, 2000);
      });
    });
  }

  createRoom() {
    return new Promise((resolve, reject) => {
      this.socket.emit('createRoom', (response) => {
        if (response.success) {
          this.roomCode = response.roomCode;
          this.playerNumber = response.playerNumber;
          console.log('Room created:', this.roomCode);
          resolve(response);
        } else {
          reject(response.error);
        }
      });
    });
  }

  joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      this.socket.emit('joinRoom', roomCode.toUpperCase(), (response) => {
        if (response.success) {
          this.roomCode = response.roomCode;
          this.playerNumber = response.playerNumber;
          console.log('Joined room:', this.roomCode);
          resolve(response);
        } else {
          reject(response.error);
        }
      });
    });
  }

  startRendering(canvas) {
    this.renderer = new Renderer(canvas);
    this.renderLoop();
  }

  renderLoop() {
    if (this.renderer && this.gameState) {
      this.renderer.render(this.gameState, this.playerNumber);
    }
    requestAnimationFrame(() => this.renderLoop());
  }

  startControls() {
    this.controls = new Controls(this);
  }

  stopControls() {
    if (this.controls) {
      this.controls.destroy();
      this.controls = null;
    }
  }

  updateGameUI() {
    if (!this.gameState) return;

    // Update scores
    const yourScoreEl = document.getElementById('yourScore');
    const opponentScoreEl = document.getElementById('opponentScore');

    if (yourScoreEl && opponentScoreEl) {
      yourScoreEl.textContent = this.gameState.scores[this.playerNumber] || 0;
      const opponentNumber = this.playerNumber === 1 ? 2 : 1;
      opponentScoreEl.textContent = this.gameState.scores[opponentNumber] || 0;
    }

    // Handle round end
    if (this.gameState.status === 'roundEnd' || this.gameState.status === 'gameOver') {
      this.showRoundEnd();
    }
  }

  showRoundEnd() {
    const overlay = document.getElementById('roundOverlay');
    const resultText = document.getElementById('roundResultText');
    const finalScores = document.getElementById('finalScores');
    const finalScoreText = document.getElementById('finalScoreText');
    const nextRoundBtn = document.getElementById('nextRoundBtn');

    overlay.classList.remove('hidden');

    if (this.gameState.status === 'gameOver') {
      if (this.gameState.gameWinner === this.playerNumber) {
        resultText.textContent = '🏆 YOU WIN THE MATCH! 🏆';
      } else {
        resultText.textContent = '💔 YOU LOST THE MATCH';
      }

      finalScores.classList.remove('hidden');
      finalScoreText.textContent = `${this.gameState.scores[1]} - ${this.gameState.scores[2]}`;
      nextRoundBtn.textContent = 'Play Again';
    } else {
      if (this.gameState.roundWinner === this.playerNumber) {
        resultText.textContent = '🎯 Round Won!';
      } else {
        resultText.textContent = '💥 Round Lost';
      }

      finalScores.classList.add('hidden');
      nextRoundBtn.textContent = 'Ready';
    }
  }

  hideRoundEnd() {
    const overlay = document.getElementById('roundOverlay');
    overlay.classList.add('hidden');
  }

  readyForNextRound() {
    this.socket.emit('playerReady');
    this.hideRoundEnd();
  }

  leaveGame() {
    this.stopControls();
    this.roomCode = null;
    this.playerNumber = null;
    this.gameState = null;

    // Return to menu
    app.showScreen('menu');
  }

  showStatus(message, type = 'info') {
    const status = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');

    statusText.textContent = message;
    status.className = 'connection-status';

    if (type === 'error') {
      status.classList.add('error');
    } else if (type === 'success') {
      status.classList.add('success');
    }

    status.classList.remove('hidden');

    if (type === 'success') {
      setTimeout(() => {
        status.classList.add('hidden');
      }, 2000);
    }
  }
}
