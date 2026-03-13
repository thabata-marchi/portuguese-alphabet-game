import { Application } from 'pixi.js';
import { Game } from './src/modules/Game';
import { Sound } from './src/modules/Sound';
import { QuestionManager } from './src/modules/QuestionManager';
import { DifficultyManager } from './src/modules/DifficultyManager';

const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;

async function init() {
  const app = new Application();

  await app.init({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    backgroundColor: 0x87CEEB,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  });

  document.body.appendChild(app.canvas);

  // Responsiveness - adjust canvas to window size
  function resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const ratio = Math.min(windowWidth / STAGE_WIDTH, windowHeight / STAGE_HEIGHT);
    app.canvas.style.width = `${STAGE_WIDTH * ratio}px`;
    app.canvas.style.height = `${STAGE_HEIGHT * ratio}px`;
  }

  window.addEventListener('resize', resize);
  resize();

  // Dependency injection
  const sound = new Sound();
  const questionManager = new QuestionManager();

  let rlAgent = null;
  try {
    const { QLearningAgent } = await import('./reinforcement-learning/agent');
    rlAgent = new QLearningAgent();
    rlAgent.load();
  } catch (e) {
    console.warn('RL Agent not loaded:', e.message);
  }

  const difficultyManager = new DifficultyManager(rlAgent);

  const game = new Game(app, STAGE_WIDTH, STAGE_HEIGHT, {
    sound,
    questionManager,
    difficultyManager
  });
  game.start();
}

init().catch(console.error);
