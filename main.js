import { Application } from 'pixi.js';
import { Game } from './src/modules/Game';
import { Sound } from './src/modules/Sound';
import { QuestionManager } from './src/modules/QuestionManager';
import { DifficultyManager } from './src/modules/DifficultyManager';

const DESKTOP_WIDTH = 800;
const DESKTOP_HEIGHT = 600;

function getStageDimensions() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isMobile = w < 600;
  if (isMobile) {
    return { width: w, height: h, isMobile: true };
  }
  return { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, isMobile: false };
}

async function init() {
  const { width: STAGE_WIDTH, height: STAGE_HEIGHT, isMobile } = getStageDimensions();

  const app = new Application();

  await app.init({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    backgroundColor: 0x87CEEB,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true
  });

  document.body.appendChild(app.canvas);

  function resize() {
    if (isMobile) {
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.objectFit = 'contain';
      app.canvas.style.objectPosition = 'center';
    } else {
      const ratio = Math.min(window.innerWidth / DESKTOP_WIDTH, window.innerHeight / DESKTOP_HEIGHT);
      app.canvas.style.width = `${DESKTOP_WIDTH * ratio}px`;
      app.canvas.style.height = `${DESKTOP_HEIGHT * ratio}px`;
      app.canvas.style.objectFit = '';
      app.canvas.style.objectPosition = '';
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 100));
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
