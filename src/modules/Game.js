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
  constructor(app, stageWidth, stageHeight, { sound, questionManager, difficultyManager, mathQuestionManager, englishQuestionManager }) {
    this.app = app;
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.state = GAME_STATES.MENU;

    this.sound = sound;
    this.questionManager = questionManager;
    this.difficultyManager = difficultyManager;
    this.mathQuestionManager = mathQuestionManager ?? null;
    this.englishQuestionManager = englishQuestionManager ?? null;
    this._mathLevelsData = null;
    this._englishLevelsData = null;
    this.speechRecognizer = null;

    this.gameMode = 'letters';
    this.lettersLevelRange = null; // [start, end] ou null = todos os níveis
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

  async _ensureMathLoaded() {
    if (this._mathLevelsData) return;
    const [mathMod, mathData] = await Promise.all([
      import('./MathQuestionManager'),
      import('../data/math-levels.json')
    ]);
    this.mathQuestionManager = new mathMod.MathQuestionManager();
    this._mathLevelsData = mathData.default;
  }

  async _ensureEnglishLoaded() {
    if (this._englishLevelsData) return;
    const [engMod, engData] = await Promise.all([
      import('./EnglishQuestionManager'),
      import('../data/english-levels.json')
    ]);
    this.englishQuestionManager = new engMod.EnglishQuestionManager();
    this._englishLevelsData = engData.default;
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
    menu.onPlayVogais = async () => {
      await this.sound.unlock();
      this.gameMode = 'letters';
      this.lettersLevelRange = [0, 0];
      this._startLevel(0);
    };
    menu.onPlayConsoantes = async () => {
      await this.sound.unlock();
      this.gameMode = 'letters';
      this.lettersLevelRange = [1, 4];
      this._startLevel(0);
    };
    menu.onPlaySilabas = async () => {
      await this.sound.unlock();
      this.gameMode = 'letters';
      this.lettersLevelRange = [5, 5];
      this._startLevel(0);
    };
    menu.onPlaySilabas2 = async () => {
      await this.sound.unlock();
      this.gameMode = 'letters';
      this.lettersLevelRange = [6, 6];
      this._startLevel(0);
    };
    menu.onPlayMath = async () => {
      await this.sound.unlock();
      this.gameMode = 'math';
      await this._ensureMathLoaded();
      this._startLevel(0);
    };
    menu.onPlayEnglish = async () => {
      await this.sound.unlock();
      this.gameMode = 'english';
      await this._ensureEnglishLoaded();
      this._startLevel(0);
    };
    menu.onActivateVoice = async () => {
      await this.sound.unlock();
      await this._initSpeech();
      if (this.speechRecognizer) {
        this.speechRecognizer.start();
        menu.setVoiceActivated();
      } else {
        menu.showHint('Use HTTPS e permita o microfone para a voz funcionar.');
        this.sound.speakText('Acesse o jogo com HTTPS e permita o microfone para usar a voz.');
      }
    };

    this.app.stage.addChild(menu);
  }

  _startLevel(levelIndex) {
    this.app.stage.removeChildren();
    this.currentLevel = levelIndex;
    this.currentWave = 0;

    let levels;
    if (this.gameMode === 'math') {
      levels = this._mathLevelsData;
    } else if (this.gameMode === 'english') {
      levels = this._englishLevelsData;
    } else {
      levels = this.lettersLevelRange
        ? levelsData.slice(this.lettersLevelRange[0], this.lettersLevelRange[1] + 1)
        : levelsData;
    }
    const level = levels[this.currentLevel];
    if (!level) {
      this._showGameOver(true);
      return;
    }

    if (this.gameMode === 'letters') {
      this.questionManager.setContent(level.contentKey);
      this.difficultyManager.resetForLevel(levelIndex);
    }
    if (this.gameMode === 'english') {
      this.englishQuestionManager.setContent(level.contentKey);
      this.difficultyManager.resetForLevel(levelIndex);
    }

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
    this.hud.micButton.visible = this.gameMode === 'letters';
    this.hud.micButton.eventMode = this.gameMode === 'letters' ? 'static' : 'none';
    this.hud.micButton.cursor = this.gameMode === 'letters' ? 'pointer' : 'default';
    this.hud.micButton.on('pointerdown', () => this._toggleMic());
    this.hud.onBackToMenu = () => {
      this._clearWaveTimer();
      this.speechRecognizer?.stop();
      this._showMenu();
    };
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
    const levelTitleSpeech = this.gameMode === 'english'
      ? `Level ${level.id}: ${level.title}`
      : `Nível ${level.id}: ${level.title}`;
    this.sound.speakText(levelTitleSpeech);

    gsap.delayedCall(2, () => {
      this._startWave();
    });
  }

  _startWave() {
    let levels;
    if (this.gameMode === 'math') {
      levels = this._mathLevelsData;
    } else if (this.gameMode === 'english') {
      levels = this._englishLevelsData;
    } else {
      levels = this.lettersLevelRange
        ? levelsData.slice(this.lettersLevelRange[0], this.lettersLevelRange[1] + 1)
        : levelsData;
    }
    const level = levels[this.currentLevel];
    if (this.currentWave >= level.waves) {
      this._levelComplete();
      return;
    }

    this.state = GAME_STATES.PLAYING;
    this.attempts = 0;
    this.waveStartTime = Date.now();
    this.difficultyManager.setAttempts(0);

    const params = this.gameMode === 'math' || this.gameMode === 'english'
      ? { optionsCount: level.optionsCount, speed: level.speed, time: level.time }
      : this.difficultyManager.gameParams;

    if (this.gameMode === 'math') {
      const question = this.mathQuestionManager.generateQuestion(level.maxSum, params.optionsCount);
      this.hud.setQuestion(question.prompt);
      this.hud.setProgress(this.currentWave, level.waves);
      this.sound.speakText(question.prompt);
      this.stage.showLetters(question, params.speed);
      this._clearWaveTimer();
      this.waveTimer = gsap.delayedCall(params.time, () => this._waveTimeout());
      return;
    }

    if (this.gameMode === 'english') {
      const question = this.englishQuestionManager.generateQuestion(params.optionsCount);
      if (!question) return;
      this.hud.setQuestion(question.prompt);
      this.hud.setProgress(this.currentWave, level.waves);
      this.sound.speakText(question.prompt);
      this.stage.showLetters(question, params.speed);
      this._clearWaveTimer();
      this.waveTimer = gsap.delayedCall(params.time, () => this._waveTimeout());
      return;
    }

    if (this.questionManager.isEncontreSilabasGame()) {
      const question = this.questionManager.generateEncontreSilabasQuestion(level.optionsCount);
      if (!question) return;
      this.hud.setQuestion(question.prompt);
      this.hud.setProgress(this.currentWave, level.waves);
      this.sound.speakText(question.prompt);
      // Sílabas I = com hífen (BO-LA); Sílabas II (id 7) = sem hífen (BOLA)
      const showHyphens = level.showHyphens === true;
      this.stage.showEncontreSilabasGame(question, params.speed, showHyphens);
      this._clearWaveTimer();
      this.waveTimer = gsap.delayedCall(params.time, () => this._waveTimeout());
      return;
    }

    if (this.questionManager.isSyllableGame()) {
      const question = this.questionManager.generateSyllableQuestion(level.optionsCount);
      if (!question) return;
      this.hud.setQuestion(question.prompt);
      this.hud.setProgress(this.currentWave, level.waves);
      this.sound.speakText(question.prompt);
      this.stage.showWordSyllableGame(question, params.speed);
      this._clearWaveTimer();
      this.waveTimer = gsap.delayedCall(params.time, () => this._waveTimeout());
      return;
    }

    const voiceData =
      this.speechRecognizer &&
      this.questionManager.generateLettersForVoice(
        Math.min(5, Math.max(3, params.optionsCount))
      );

    if (voiceData) {
      this.hud.setQuestion('Fale todas as letras!');
      this.hud.setProgress(this.currentWave, level.waves);
      this.sound.speakText('Fale todas as letras!');
      this.stage.showLettersForVoice(voiceData.letters, params.speed);
      this.speechRecognizer.stop();
      setTimeout(() => {
        if (this.speechRecognizer && this.state === GAME_STATES.PLAYING) {
          this.speechRecognizer.start();
          this.hud.setMicActive(true);
        }
      }, 120);
    } else {
      const question = this.questionManager.generateQuestion(params.optionsCount);
      if (!question) return;
      this.hud.setQuestion(question.prompt);
      this.hud.setProgress(this.currentWave, level.waves);
      this.sound.speakText(question.prompt);
      this.stage.showLetters(question, params.speed);
      this._clearWaveTimer();
      this.waveTimer = gsap.delayedCall(params.time, () => this._waveTimeout());
    }
  }

  _handleVoiceWaveComplete() {
    this.stars++;
    this.hud.setStars(this.stars);
    const feedbackMsg = this.gameMode === 'english' ? 'Well done! ⭐' : 'Muito bem! ⭐';
    this.hud.showFeedback(feedbackMsg, 0x2ECC71);
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
      const feedbackMsg = this.gameMode === 'english' ? 'Well done! ⭐' : 'Muito bem! ⭐';
      this.hud.showFeedback(feedbackMsg, 0x2ECC71);
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
        const hintMsg = this.gameMode === 'english' ? 'Look at the hint!' : 'Olha a dica!';
        this.hud.showFeedback(hintMsg, 0xF39C12);
      }
    }
  }

  _waveTimeout() {
    this.stage.showHint();
    const timeoutMsg = this.gameMode === 'english' ? 'Time\'s up!' : 'Tempo!';
    this.hud.showFeedback(timeoutMsg, 0xE74C3C);
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

    let levels;
    if (this.gameMode === 'math') {
      levels = this._mathLevelsData;
    } else if (this.gameMode === 'english') {
      levels = this._englishLevelsData;
    } else {
      levels = this.lettersLevelRange
        ? levelsData.slice(this.lettersLevelRange[0], this.lettersLevelRange[1] + 1)
        : levelsData;
    }
    const level = levels[this.currentLevel];

    this.sound.play('levelUp');
    const completeMsg = this.gameMode === 'english' ? `${level.title} complete!` : `${level.title} Completo!`;
    this.hud.showFeedback(completeMsg, 0xFFD700);
    const speakMsg = this.gameMode === 'english'
      ? `Well done! You completed ${level.title}!`
      : `Parabéns! Você completou ${level.title}!`;
    this.sound.speakText(speakMsg);
    this.mascot.celebrate();
    this.difficultyManager.recordLevelComplete();

    gsap.delayedCall(3, () => {
      if (this.currentLevel + 1 < levels.length) {
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
