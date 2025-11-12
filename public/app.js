class App {
  constructor() {
    this.game = new Game();
    this.currentScreen = 'menu';

    this.init();
  }

  async init() {
    // Setup UI event listeners
    this.setupMenuEvents();
    this.setupWaitingEvents();
    this.setupGameEvents();

    // Connect to server
    try {
      await this.game.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect to server. Please refresh the page.');
    }
  }

  setupMenuEvents() {
    const createRoomBtn = document.getElementById('createRoomBtn');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const confirmJoinBtn = document.getElementById('confirmJoinBtn');
    const cancelJoinBtn = document.getElementById('cancelJoinBtn');
    const roomCodeInput = document.getElementById('roomCodeInput');
    const joinRoomPanel = document.getElementById('joinRoomPanel');

    createRoomBtn.addEventListener('click', async () => {
      try {
        await this.game.createRoom();
        this.showScreen('waiting');
        this.displayRoomCode();
      } catch (error) {
        alert('Failed to create room: ' + error);
      }
    });

    joinRoomBtn.addEventListener('click', () => {
      joinRoomPanel.classList.remove('hidden');
      roomCodeInput.focus();
    });

    cancelJoinBtn.addEventListener('click', () => {
      joinRoomPanel.classList.add('hidden');
      roomCodeInput.value = '';
    });

    confirmJoinBtn.addEventListener('click', async () => {
      const code = roomCodeInput.value.trim().toUpperCase();
      if (code.length !== 6) {
        alert('Please enter a valid 6-character room code');
        return;
      }

      try {
        await this.game.joinRoom(code);
        joinRoomPanel.classList.add('hidden');
        roomCodeInput.value = '';
        this.startGame();
      } catch (error) {
        alert('Failed to join room: ' + error);
      }
    });

    // Allow Enter key to join
    roomCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        confirmJoinBtn.click();
      }
    });

    // Auto-uppercase input
    roomCodeInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  setupWaitingEvents() {
    const cancelWaitBtn = document.getElementById('cancelWaitBtn');
    const copyCodeBtn = document.getElementById('copyCodeBtn');

    cancelWaitBtn.addEventListener('click', () => {
      this.game.leaveGame();
    });

    copyCodeBtn.addEventListener('click', () => {
      const code = this.game.roomCode;
      if (code) {
        // Try to use Clipboard API
        if (navigator.clipboard) {
          navigator.clipboard.writeText(code).then(() => {
            this.showCopyFeedback();
          }).catch(() => {
            this.fallbackCopy(code);
          });
        } else {
          this.fallbackCopy(code);
        }
      }
    });

    // Listen for game start
    this.game.socket.on('gameState', (state) => {
      if (this.currentScreen === 'waiting' && state.status === 'playing') {
        this.startGame();
      }
    });
  }

  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.showCopyFeedback();
    } catch (err) {
      alert('Failed to copy code: ' + text);
    }

    document.body.removeChild(textArea);
  }

  showCopyFeedback() {
    const copyBtn = document.getElementById('copyCodeBtn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    copyBtn.style.background = 'rgba(76, 175, 80, 0.3)';

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '';
    }, 2000);
  }

  setupGameEvents() {
    const nextRoundBtn = document.getElementById('nextRoundBtn');
    const quitBtn = document.getElementById('quitBtn');

    nextRoundBtn.addEventListener('click', () => {
      this.game.readyForNextRound();
    });

    quitBtn.addEventListener('click', () => {
      this.game.leaveGame();
    });
  }

  displayRoomCode() {
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    roomCodeDisplay.textContent = this.game.roomCode;
  }

  startGame() {
    this.showScreen('game');

    const canvas = document.getElementById('gameCanvas');
    this.game.startRendering(canvas);
    this.game.startControls();
  }

  showScreen(screenName) {
    const screens = {
      menu: document.getElementById('menuScreen'),
      waiting: document.getElementById('waitingScreen'),
      game: document.getElementById('gameScreen')
    };

    for (const [name, screen] of Object.entries(screens)) {
      if (name === screenName) {
        screen.classList.remove('hidden');
      } else {
        screen.classList.add('hidden');
      }
    }

    this.currentScreen = screenName;
  }
}

// Initialize app when DOM is ready
let app;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new App();
  });
} else {
  app = new App();
}
