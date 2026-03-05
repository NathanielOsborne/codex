"use strict";

const GRID_SIZE = 20;
const TICK_MS = 120;
const DIRECTIONS = Object.freeze({
  up: Object.freeze({ x: 0, y: -1 }),
  down: Object.freeze({ x: 0, y: 1 }),
  left: Object.freeze({ x: -1, y: 0 }),
  right: Object.freeze({ x: 1, y: 0 })
});

const OPPOSITES = Object.freeze({
  up: "down",
  down: "up",
  left: "right",
  right: "left"
});

function createInitialState(rng = Math.random) {
  const start = { x: 9, y: 10 };
  const snake = [start, { x: 8, y: 10 }, { x: 7, y: 10 }];
  const food = placeFood(snake, GRID_SIZE, rng);

  return {
    snake,
    direction: "right",
    nextDirection: "right",
    food,
    score: 0,
    isGameOver: false,
    isPaused: false,
    gridSize: GRID_SIZE
  };
}

function setNextDirection(currentDirection, requestedDirection) {
  if (!DIRECTIONS[requestedDirection]) {
    return currentDirection;
  }
  if (OPPOSITES[currentDirection] === requestedDirection) {
    return currentDirection;
  }
  return requestedDirection;
}

function stepGame(state, rng = Math.random) {
  if (state.isGameOver || state.isPaused) {
    return state;
  }

  const direction = state.nextDirection;
  const vector = DIRECTIONS[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };

  if (
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize
  ) {
    return { ...state, direction, isGameOver: true };
  }

  const grew = nextHead.x === state.food.x && nextHead.y === state.food.y;
  const bodyToCheck = grew ? state.snake : state.snake.slice(0, -1);
  const hitBody = bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
  if (hitBody) {
    return { ...state, direction, isGameOver: true };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!grew) {
    nextSnake.pop();
  }

  return {
    ...state,
    snake: nextSnake,
    direction,
    score: grew ? state.score + 1 : state.score,
    food: grew ? placeFood(nextSnake, state.gridSize, rng) : state.food
  };
}

function placeFood(snake, gridSize, rng = Math.random) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const freeCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return snake[0];
  }

  const index = Math.floor(rng() * freeCells.length);
  return freeCells[index];
}

function mountSnakeGame() {
  const root = document.querySelector("[data-snake-root]");
  if (!root) {
    return;
  }

  const scoreEl = root.querySelector("[data-score]");
  const statusEl = root.querySelector("[data-status]");
  const gridEl = root.querySelector("[data-grid]");
  const restartBtn = root.querySelector("[data-restart]");
  const pauseBtn = root.querySelector("[data-pause]");
  const controlButtons = root.querySelectorAll("[data-control]");

  let state = createInitialState();
  let intervalId = null;

  function renderGrid(currentState) {
    const snakeSet = new Set(currentState.snake.map((segment) => `${segment.x},${segment.y}`));
    const headKey = `${currentState.snake[0].x},${currentState.snake[0].y}`;

    let html = "";
    for (let y = 0; y < currentState.gridSize; y += 1) {
      for (let x = 0; x < currentState.gridSize; x += 1) {
        const key = `${x},${y}`;
        let className = "cell";
        if (key === `${currentState.food.x},${currentState.food.y}`) {
          className += " food";
        } else if (key === headKey) {
          className += " snake-head";
        } else if (snakeSet.has(key)) {
          className += " snake";
        }
        html += `<div class="${className}" aria-hidden="true"></div>`;
      }
    }

    gridEl.innerHTML = html;
  }

  function render(currentState) {
    scoreEl.textContent = String(currentState.score);

    if (currentState.isGameOver) {
      statusEl.textContent = "Game Over";
    } else if (currentState.isPaused) {
      statusEl.textContent = "Paused";
    } else {
      statusEl.textContent = "Playing";
    }

    pauseBtn.textContent = currentState.isPaused ? "Resume" : "Pause";
    renderGrid(currentState);
  }

  function tick() {
    state = stepGame(state);
    render(state);
    if (state.isGameOver && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startLoop() {
    if (intervalId) {
      clearInterval(intervalId);
    }
    intervalId = setInterval(tick, TICK_MS);
  }

  function restart() {
    state = createInitialState();
    render(state);
    startLoop();
  }

  function togglePause() {
    if (state.isGameOver) {
      return;
    }
    state = { ...state, isPaused: !state.isPaused };
    render(state);
  }

  function requestDirection(direction) {
    state = {
      ...state,
      nextDirection: setNextDirection(state.direction, direction)
    };
  }

  const keyToDirection = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right"
  };

  window.addEventListener("keydown", (event) => {
    const direction = keyToDirection[event.key];
    if (direction) {
      event.preventDefault();
      requestDirection(direction);
      return;
    }
    if (event.key === " " || event.key === "p" || event.key === "P") {
      event.preventDefault();
      togglePause();
    }
    if (event.key === "r" || event.key === "R") {
      event.preventDefault();
      restart();
    }
  });

  restartBtn.addEventListener("click", restart);
  pauseBtn.addEventListener("click", togglePause);
  controlButtons.forEach((button) => {
    button.addEventListener("click", () => requestDirection(button.dataset.control));
  });

  restart();
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", mountSnakeGame);
}
