class Controls {
  constructor(game) {
    this.game = game;
    this.moveJoystick = null;
    this.rotateJoystick = null;
    this.fireButton = null;

    this.moveValue = 0;
    this.rotateValue = 0;
    this.isFiring = false;

    this.activeTouches = new Map();

    this.init();
  }

  init() {
    this.moveJoystick = new Joystick('moveJoystick', (value) => {
      this.moveValue = value;
      this.sendInput();
    });

    this.rotateJoystick = new Joystick('rotateJoystick', (value) => {
      this.rotateValue = value;
      this.sendInput();
    });

    // Fire button
    this.fireButton = document.getElementById('fireBtn');

    this.fireButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleFire(true);
    });

    this.fireButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleFire(false);
    });

    this.fireButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.handleFire(true);
    });

    this.fireButton.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.handleFire(false);
    });

    // Keyboard controls for desktop
    this.setupKeyboardControls();
  }

  setupKeyboardControls() {
    const keys = {};

    window.addEventListener('keydown', (e) => {
      keys[e.key] = true;
      this.updateKeyboardInput(keys);
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key] = false;
      this.updateKeyboardInput(keys);
    });
  }

  updateKeyboardInput(keys) {
    // Movement (W/S or Arrow Up/Down)
    if (keys['w'] || keys['W'] || keys['ArrowUp']) {
      this.moveValue = 1;
    } else if (keys['s'] || keys['S'] || keys['ArrowDown']) {
      this.moveValue = -1;
    } else {
      this.moveValue = 0;
    }

    // Rotation (A/D or Arrow Left/Right)
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
      this.rotateValue = -1;
    } else if (keys['d'] || keys['D'] || keys['ArrowRight']) {
      this.rotateValue = 1;
    } else {
      this.rotateValue = 0;
    }

    // Fire (Space)
    if (keys[' '] || keys['Space']) {
      this.handleFire(true);
    } else {
      this.handleFire(false);
    }

    this.sendInput();
  }

  handleFire(isPressed) {
    const wasNotFiring = !this.isFiring;
    this.isFiring = isPressed;

    if (wasNotFiring && isPressed) {
      this.sendInput();
    }
  }

  sendInput() {
    if (this.game && this.game.socket) {
      this.game.socket.emit('playerInput', {
        move: this.moveValue,
        rotate: this.rotateValue,
        shoot: this.isFiring
      });
    }
  }

  destroy() {
    if (this.moveJoystick) this.moveJoystick.destroy();
    if (this.rotateJoystick) this.rotateJoystick.destroy();
  }
}

class Joystick {
  constructor(elementId, callback) {
    this.element = document.getElementById(elementId);
    this.button = this.element.querySelector('.joystick-button');
    this.inner = this.element.querySelector('.joystick-inner');
    this.callback = callback;

    this.active = false;
    this.currentTouch = null;
    this.value = 0;

    this.centerX = 0;
    this.centerY = 0;
    this.maxDistance = 35; // Maximum distance from center

    this.init();
  }

  init() {
    // Touch events
    this.button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleStart(e.touches[0]);
    });

    this.button.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.active) {
        this.handleMove(e.touches[0]);
      }
    });

    this.button.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleEnd();
    });

    // Mouse events for desktop
    this.button.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.handleStart(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.active) {
        this.handleMove(e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.active) {
        this.handleEnd();
      }
    });
  }

  handleStart(touch) {
    this.active = true;
    this.button.classList.add('active');

    const rect = this.button.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
  }

  handleMove(touch) {
    const dx = touch.clientX - this.centerX;
    const dy = touch.clientY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate joystick value (-1 to 1)
    let moveX = dx;
    let moveY = dy;

    if (distance > this.maxDistance) {
      moveX = (dx / distance) * this.maxDistance;
      moveY = (dy / distance) * this.maxDistance;
    }

    // Update visual position
    this.inner.style.transform = `translate(${moveX}px, ${moveY}px)`;

    // For vertical joystick (move forward/backward)
    if (this.element.id === 'moveJoystick') {
      this.value = -moveY / this.maxDistance; // Negative because down is positive Y
    }
    // For horizontal joystick (rotate left/right)
    else if (this.element.id === 'rotateJoystick') {
      this.value = moveX / this.maxDistance;
    }

    this.callback(this.value);
  }

  handleEnd() {
    this.active = false;
    this.button.classList.remove('active');
    this.inner.style.transform = 'translate(0, 0)';
    this.value = 0;
    this.callback(this.value);
  }

  destroy() {
    // Clean up event listeners if needed
  }
}
