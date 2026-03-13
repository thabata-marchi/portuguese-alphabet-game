import { gsap } from 'gsap';
import { Stage } from './Stage';
import { Hud } from './Hud';
import { Mascot } from './Mascot';
import { MenuScreen } from './MenuScreen';
import { GameOverScreen } from './GameOverScreen';
import levelsData from '../data/levels.json';

const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  WAVE_TRANSITION: 'wave_transition',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over'
};

export class Game {
  constructor(app, stageWidth, stageHeight, { sound, questionManager, difficultyManager }) {
    this.app = app;
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.state = GAME_STATES.MENU;

    this.sound = sound;
    this.questionManager = questionManager;
    this.difficultyManager = difficultyManager;
    this.speechRecognizer = null;

    this.currentLevel = 0;
    this.currentWave = 0;
    this.stars = 0;
    this.attempts = 0;
    this.waveStartTime = 0;
    this.waveTimer = null;
  }

  async start() {
    this._showMenu();
  }

  async _initSpeech() {
    try {
      const { SpeechRecognizer } = await import('../../speech-recognition/speech');
      this.speechRecognizer = new SpeechRecognizer();
      await this.speechRecognizer.init();
      this.speechRecognizer.onResult = (letter) => {
        if (this.state === GAME_STATES.PLAYING && this.stage) {
          this.stage.handleVoiceAnswer(letter);
        }
      };
    } catch (e) {
      console.warn('Speech recognition not available:', e.message);
    }
  }

  _showMenu() {
    this.state = GAME_STATES.MENU;
    this.app.stage.removeChildren();

    const menu = new MenuScreen(this.stageWidth, this.stageHeight, this.sound);
    menu.onPlay = async () => {
      await this.sound.unlock();
      this._startLevel(0);
    };
    menu.onActivateVoice = async () => {
      await this.sound.unlock();
      await this._initSpeech();
      if (this.speechRecognizer) {
        this.speechRecognizer.start();
        menu.setVoiceActivated();
      }
    };

    this.app.stage.addChild(menu);
  }

  _startLevel(levelIndex) {
    this.app.stage.removeChildren();
    this.currentLevel = levelIndex;
    this.currentWave = 0;

    const level = levelsData[this.currentLevel];
    if (!level) {
      this._showGameOver(true);
      return;
    }

    this.questionManager.setContent(level.contentKey);
    this.difficultyManager.resetForLevel(levelIndex);

    // Create the game stage
    this.stage = new Stage(this.stageWidth, this.stageHeight, this.sound);
    this.stage.onAnswer = (isCorrect, letter) => this._handleAnswer(isCorrect, letter);
    this.stage.onAllLettersSpoken = () => this._handleVoiceWaveComplete();
    this.app.stage.addChild(this.stage);

    // Create the HUD
    this.hud = new Hud(this.stageWidth, this.stageHeight);
    this.hud.setStars(this.stars);
    this.hud.setLevel(level.id, level.title);
    this.hud.setProgress(0, level.waves);
    if (this.speechRecognizer?.isListening) this.hud.setMicActive(true);
    this.hud.micButton.on('pointerdown', () => this._toggleMic());
    this.app.stage.addChild(this.hud);

    const mascotScale = Math.min(0.8, 0.5 + (this.stageWidth / 800) * 0.3);
    const mascotMarginX = Math.max(40, this.stageWidth * 0.075);
    const mascotMarginY = Math.max(60, this.stageHeight * 0.17);
    this.mascot = new Mascot();
    this.mascot.x = mascotMarginX;
    this.mascot.y = this.stageHeight - mascotMarginY;
    this.mascot.scale.set(mascotScale);
    this.mascot.idle();
    this.app.stage.addChild(this.mascot);

    // Show level title
    this.state = GAME_STATES.WAVE_TRANSITION;
    this.hud.showFeedback(`${level.title}`, 0xFFD700);
    this.sound.speakText(`Nível ${level.id}: ${level.title}`);

    gsap.delayedCall(2, () => {
      this._startWave();
    });
  }

  _startWave() {
    const level = levelsData[this.currentLevel];
    if (this.currentWave >= level.waves) {
      this._levelComplete();
      return;
    }

    this.state = GAME_STATES.PLAYING;
    this.attempts = 0;
    this.waveStartTime = Date.now();
    this.difficultyManager.setAttempts(0);

    const params = this.difficultyManager.gameParams;

    const voiceData =
      this.speechRecognizer &&
      this.questionManager.generateLettersForVoice(
        Math.min(5, Math.max(3, params.optionsCount))
      );

    if (voiceData) {
      // Modo voz: mostrar letras e pedir "Fale todas as letras" (sem clicar)
      this.hud.setQuestion('Fale todas as letras!');
      this.hud.setProgress(this.currentWave, level.waves);
      this.sound.speakText('Fale todas as letras!');
      this.stage.showLettersForVoice(voiceData.letters, params.speed);

      if (!this.speechRecognizer.isListening) {
        this.speechRecognizer.start();
        this.hud.setMicActive(true);
      }
      // Sem timer no modo voz
    } else {
      // Modo normal: encontre uma letra (clique)
      const question = this.questionManager.generateQuestion(params.optionsCount);
      if (!question) return;

      this.hud.setQuestion(question.prompt);
      this.hud.setProgress(this.currentWave, level.waves);
      this.sound.speakText(question.prompt);
      this.stage.showLetters(question, params.speed);

      this._clearWaveTimer();
      this.waveTimer = gsap.delayedCall(params.time, () => {
        this._waveTimeout();
      });
    }
  }

  _handleVoiceWaveComplete() {
    this.stars++;
    this.hud.setStars(this.stars);
    this.hud.showFeedback('Muito bem! ⭐', 0x2ECC71);
    this.mascot.celebrate();

    gsap.delayedCall(1.5, () => {
      this.currentWave++;
      this._startWave();
    });
  }

  _handleAnswer(isCorrect, letter) {
    this.attempts++;
    this.difficultyManager.setAttempts(this.attempts);

    if (isCorrect) {
      const responseTime = (Date.now() - this.waveStartTime) / 1000;

      this.stars++;
      this.hud.setStars(this.stars);
      this.hud.showFeedback('Muito bem! ⭐', 0x2ECC71);
      this.mascot.celebrate();
      this.difficultyManager.recordCorrect(responseTime);

      this._clearWaveTimer();

      gsap.delayedCall(1.5, () => {
        this.currentWave++;
        this._startWave();
      });
    } else {
      this.difficultyManager.recordWrong();
      this.mascot.encourage();

      if (this.attempts >= 2) {
        this.stage.showHint();
        this.hud.showFeedback('Olha a dica!', 0xF39C12);
      }
    }
  }

  _waveTimeout() {
    this.stage.showHint();
    this.hud.showFeedback('Tempo!', 0xE74C3C);
    this.mascot.encourage();
    this.difficultyManager.recordTimeout();

    gsap.delayedCall(2, () => {
      this.currentWave++;
      this._startWave();
    });
  }

  _levelComplete() {
    this.state = GAME_STATES.LEVEL_COMPLETE;
    this.stage.clearLetters();

    const level = levelsData[this.currentLevel];

    this.sound.play('levelUp');
    this.hud.showFeedback(`${level.title} Completo!`, 0xFFD700);
    this.sound.speakText(`Parabéns! Você completou ${level.title}!`);
    this.mascot.celebrate();
    this.difficultyManager.recordLevelComplete();

    gsap.delayedCall(3, () => {
      if (this.currentLevel + 1 < levelsData.length) {
        this._startLevel(this.currentLevel + 1);
      } else {
        this._showGameOver(true);
      }
    });
  }

  _showGameOver(isVictory) {
    this.state = GAME_STATES.GAME_OVER;
    this.app.stage.removeChildren();

    const screen = new GameOverScreen(this.stageWidth, this.stageHeight, this.sound);
    screen.onReplay = () => {
      this.stars = 0;
      this.difficultyManager.resetProgress();
      this._showMenu();
    };
    screen.onMenu = () => this._showMenu();
    screen.show(isVictory, this.stars);

    this.app.stage.addChild(screen);
  }

  _toggleMic() {
    if (!this.speechRecognizer) {
      this._initSpeech().then(() => {
        if (this.speechRecognizer) {
          this.speechRecognizer.start();
          this.hud.setMicActive(true);
        }
      });
      return;
    }

    if (this.speechRecognizer.isListening) {
      this.speechRecognizer.stop();
      this.hud.setMicActive(false);
    } else {
      this.speechRecognizer.start();
      this.hud.setMicActive(true);
    }
  }

  _clearWaveTimer() {
    if (this.waveTimer) {
      this.waveTimer.kill();
      this.waveTimer = null;
    }
  }
}
