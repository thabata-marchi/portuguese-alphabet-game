import { Container, Graphics, Text } from 'pixi.js';
import { gsap } from 'gsap';
import { Letter } from './Letter';
import { ColorBall } from './ColorBall';
import { randomBetween } from '../libs/utils';

export class Stage extends Container {
  constructor(stageWidth, stageHeight, sound) {
    super();
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.sound = sound;
    this.letters = [];
    this.currentQuestion = null;
    this.voiceMode = false; // modo "fale todas as letras"
    this.lettersSpoken = new Set(); // letras já ditas no modo voz
    this.onAnswer = null; // callback: (isCorrect, letter) => {}
    this.onAllLettersSpoken = null; // callback quando todas as letras forem ditas (modo voz)
    this.syllableGameMode = false;
    this.syllableExpectedIndex = 0;
    this.encontreSyllableGameMode = false;
    this.remainingSyllables = []; // cópia das sílabas que faltam acertar (ordem livre)
    this.wordText = null;   // texto da palavra (estilo forca)
    this.slotsText = null;  // texto dos espaços _ _ ou BO LA

    this._createBackground();
  }

  _createBackground() {
    // Gradient sky
    const sky = new Graphics();
    sky.rect(0, 0, this.stageWidth, this.stageHeight);
    sky.fill({ color: 0x87CEEB });
    this.addChild(sky);

    const cloudYMin = this.stageHeight * 0.13;
    const cloudYMax = this.stageHeight * 0.33;
    for (let i = 0; i < 4; i++) {
      const cloud = this._createCloud();
      cloud.x = randomBetween(this.stageWidth * 0.06, this.stageWidth - this.stageWidth * 0.06);
      cloud.y = randomBetween(cloudYMin, cloudYMax);
      cloud.alpha = 0.6;
      this.addChild(cloud);

      // Clouds move slowly
      gsap.to(cloud, {
        x: cloud.x + randomBetween(-100, 100),
        duration: randomBetween(15, 25),
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    }

    const grassHeight = Math.max(50, this.stageHeight * 0.13);
    const grass = new Graphics();
    grass.rect(0, this.stageHeight - grassHeight, this.stageWidth, grassHeight);
    grass.fill({ color: 0x27AE60 });
    this.addChild(grass);

    const grassStep = Math.max(12, this.stageWidth * 0.025);
    const grassDetail = new Graphics();
    for (let x = 0; x < this.stageWidth; x += grassStep) {
      const h = randomBetween(10, 30);
      grassDetail.moveTo(x, this.stageHeight - grassHeight);
      grassDetail.lineTo(x + 5, this.stageHeight - grassHeight - h);
      grassDetail.lineTo(x + 10, this.stageHeight - grassHeight);
    }
    grassDetail.stroke({ color: 0x2ECC71, width: 2 });
    this.addChild(grassDetail);
  }

  _createCloud() {
    const cloud = new Graphics();
    cloud.circle(0, 0, 25);
    cloud.circle(20, -10, 20);
    cloud.circle(40, 0, 25);
    cloud.circle(20, 5, 20);
    cloud.fill({ color: 0xFFFFFF, alpha: 0.8 });
    return cloud;
  }

  showLetters(question, speed) {
    this.clearLetters();
    this.currentQuestion = question;
    this.voiceMode = false;

    const { options, correctAnswer, optionType, colorMap } = question;
    const spacing = this.stageWidth / (options.length + 1);
    const useColorBalls = optionType === 'color' && colorMap;

    options.forEach((optionValue, index) => {
      const letter = useColorBalls
        ? new ColorBall(optionValue, colorMap[optionValue], this.stageWidth, this.stageHeight)
        : new Letter(optionValue, this.stageWidth, this.stageHeight);
      letter.isCorrect = (optionValue === correctAnswer);
      letter.setSpeed(speed);

      const startX = spacing * (index + 1);
      const startY = randomBetween(this.stageHeight * 0.2, this.stageHeight * 0.67);

      letter.on('pointerdown', () => this._onLetterClick(letter));

      this.addChild(letter);
      this.letters.push(letter);

      gsap.delayedCall(index * 0.2, () => {
        letter.spawn(startX, startY);
      });
    });
  }

  /**
   * Modo "Encontre as sílabas que formam a palavra": balões com sílabas; ordem livre.
   * @param {boolean} showHyphens - true = palavra com hífens (BO-LA); false = palavra sem hífens (BOLA).
   */
  showEncontreSilabasGame(question, speed, showHyphens = true) {
    this.clearLetters();
    this.currentQuestion = question;
    this.voiceMode = false;
    this.syllableGameMode = false;
    this.encontreSyllableGameMode = true;
    this.remainingSyllables = [...question.syllables];

    const { word, wordWithHyphens, options } = question;
    const wordDisplay = showHyphens && wordWithHyphens ? wordWithHyphens : word;

    // Palavra em destaque (com ou sem hífens conforme o nível)
    const wordFontSize = Math.max(38, Math.min(64, this.stageWidth * 0.11));
    this.wordText = new Text({
      text: wordDisplay,
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: wordFontSize,
        fontWeight: 'bold',
        fill: 0x2C3E50,
        align: 'center',
        dropShadow: { color: 0xFFFFFF, blur: 4, distance: 2 }
      }
    });
    this.wordText.anchor.set(0.5);
    this.wordText.x = this.stageWidth / 2;
    this.wordText.y = this.stageHeight * 0.28;
    this.addChild(this.wordText);

    // Balões com sílabas (ordem livre)
    const spacing = this.stageWidth / (options.length + 1);
    options.forEach((syl, index) => {
      const letter = new Letter(syl, this.stageWidth, this.stageHeight);
      letter.setSpeed(speed);
      const startX = spacing * (index + 1);
      const startY = this.stageHeight * 0.55 + (index % 2) * 50;
      letter.x = startX;
      letter.y = startY;
      letter.alpha = 0;
      letter.scale.set(0);
      letter.on('pointerdown', () => this._onEncontreSyllableClick(letter));
      this.addChild(letter);
      this.letters.push(letter);
      gsap.to(letter, { alpha: 1, duration: 0.25 });
      gsap.to(letter.scale, { x: 1, y: 1, duration: 0.3, delay: index * 0.08, ease: 'back.out' });
    });
  }

  _onEncontreSyllableClick(letter) {
    if (!this.encontreSyllableGameMode || !letter.isClickable || !this.currentQuestion) return;
    const idx = this.remainingSyllables.indexOf(letter.letter);

    this.sound.play('click');

    if (idx !== -1) {
      this.remainingSyllables.splice(idx, 1);
      letter.isClickable = false;
      letter.correct();
      this.sound.play('correct');

      if (this.remainingSyllables.length === 0) {
        this.sound.play('star');
        if (this.onAnswer) this.onAnswer(true, this.currentQuestion.word);
      }
    } else {
      letter.wrong();
      this.sound.play('wrong');
      if (this.onAnswer) this.onAnswer(false, letter.letter);
    }
  }

  /**
   * Modo "Como escreve?": mostra a palavra (estilo forca) e opções de sílabas; o jogador seleciona na ordem.
   */
  showWordSyllableGame(question, speed) {
    this.clearLetters();
    this.currentQuestion = question;
    this.voiceMode = false;
    this.syllableGameMode = true;
    this.syllableExpectedIndex = 0;

    const { word, syllables, options } = question;
    const scale = Math.min(1, this.stageWidth / 800);

    // Palavra em destaque (estilo forca)
    const wordFontSize = Math.max(42, Math.min(72, this.stageWidth * 0.12));
    this.wordText = new Text({
      text: word,
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: wordFontSize,
        fontWeight: 'bold',
        fill: 0x2C3E50,
        align: 'center',
        dropShadow: { color: 0xFFFFFF, blur: 4, distance: 2 }
      }
    });
    this.wordText.anchor.set(0.5);
    this.wordText.x = this.stageWidth / 2;
    this.wordText.y = this.stageHeight * 0.28;
    this.addChild(this.wordText);

    // Slots: _ _ que viram BO LA
    const slotFontSize = Math.max(24, Math.min(36, this.stageWidth * 0.06));
    this.slotsText = new Text({
      text: syllables.map(() => '_').join('   '),
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: slotFontSize,
        fontWeight: 'bold',
        fill: 0x34495E,
        align: 'center'
      }
    });
    this.slotsText.anchor.set(0.5);
    this.slotsText.x = this.stageWidth / 2;
    this.slotsText.y = this.stageHeight * 0.38;
    this.addChild(this.slotsText);

    // Opções de sílabas (balões clicáveis)
    const spacing = this.stageWidth / (options.length + 1);
    options.forEach((syl, index) => {
      const letter = new Letter(syl, this.stageWidth, this.stageHeight);
      letter.setSpeed(speed);
      const startX = spacing * (index + 1);
      const startY = this.stageHeight * 0.55 + (index % 2) * 50;
      letter.x = startX;
      letter.y = startY;
      letter.alpha = 0;
      letter.scale.set(0);
      letter.isCorrect = false; // avaliado na ordem em _onSyllableClick
      letter.on('pointerdown', () => this._onSyllableClick(letter));
      this.addChild(letter);
      this.letters.push(letter);
      gsap.to(letter, { alpha: 1, duration: 0.25 });
      gsap.to(letter.scale, { x: 1, y: 1, duration: 0.3, delay: index * 0.08, ease: 'back.out' });
    });
  }

  _onSyllableClick(letter) {
    if (!this.syllableGameMode || !letter.isClickable || !this.currentQuestion) return;
    const { syllables } = this.currentQuestion;
    const expected = syllables[this.syllableExpectedIndex];

    this.sound.play('click');

    if (letter.letter === expected) {
      letter.isClickable = false;
      letter.correct();
      this.sound.play('correct');
      this.syllableExpectedIndex++;
      const filled = syllables.slice(0, this.syllableExpectedIndex).join('   ');
      const rest = syllables.slice(this.syllableExpectedIndex).map(() => '_').join('   ');
      this.slotsText.text = (filled + (rest ? '   ' + rest : '')).trim();

      if (this.syllableExpectedIndex >= syllables.length) {
        this.sound.play('star');
        if (this.onAnswer) this.onAnswer(true, this.currentQuestion.word);
      }
    } else {
      letter.wrong();
      this.sound.play('wrong');
      if (this.onAnswer) this.onAnswer(false, letter.letter);
    }
  }

  /**
   * Modo voz: mostra as letras na tela para a criança falar todas (sem clicar).
   */
  showLettersForVoice(letters, speed) {
    this.clearLetters();
    this.voiceMode = true;
    this.lettersSpoken.clear();
    this.currentQuestion = { letters };

    const spacing = this.stageWidth / (letters.length + 1);

    letters.forEach((letterText, index) => {
      const letter = new Letter(letterText, this.stageWidth, this.stageHeight);
      letter.isCorrect = true; // todas são "corretas" quando ditas
      letter.setSpeed(speed);
      letter.eventMode = 'none'; // não clicável no modo voz
      letter.cursor = 'default';

      const startX = spacing * (index + 1);
      const startY = randomBetween(this.stageHeight * 0.2, this.stageHeight * 0.67);

      this.addChild(letter);
      this.letters.push(letter);

      gsap.delayedCall(index * 0.2, () => {
        letter.spawn(startX, startY);
      });
    });
  }

  _onLetterClick(letter) {
    if (!letter.isClickable) return;

    this.sound.play('click');

    if (letter.isCorrect) {
      letter.correct();
      this.sound.play('correct');
      this.sound.play('star');
      if (this.onAnswer) this.onAnswer(true, letter.letter);
    } else {
      letter.wrong();
      this.sound.play('wrong');
      if (this.onAnswer) this.onAnswer(false, letter.letter);
    }
  }

  handleVoiceAnswer(spokenLetter) {
    const key = spokenLetter.toUpperCase();

    if (this.voiceMode) {
      let matchingLetter = this.letters.find(
        l => l.letter.toUpperCase() === key && !this.lettersSpoken.has(l.letter.toUpperCase())
      );
      if (!matchingLetter && (key === 'E' || key === 'I')) {
        const confusable = key === 'E' ? 'I' : 'E';
        matchingLetter = this.letters.find(
          l => l.letter.toUpperCase() === confusable && !this.lettersSpoken.has(confusable)
        );
        if (matchingLetter) key = confusable;
      }
      if (matchingLetter) {
        this.lettersSpoken.add(key);
        this.sound.play('pop');
        matchingLetter.pop();
        if (this.lettersSpoken.size >= this.letters.length && this.onAllLettersSpoken) {
          this.onAllLettersSpoken();
        }
        return true;
      }
      return false;
    }

    const matchingLetter = this.letters.find(
      l => l.letter.toUpperCase() === key && l.isClickable
    );
    if (matchingLetter) {
      this._onLetterClick(matchingLetter);
      return true;
    }
    return false;
  }

  showHint() {
    if (this.encontreSyllableGameMode && this.remainingSyllables.length > 0) {
      const nextSyl = this.remainingSyllables[0];
      const correctLetter = this.letters.find(l => l.letter === nextSyl && l.isClickable);
      if (correctLetter) correctLetter.hint();
      return;
    }
    if (this.syllableGameMode && this.currentQuestion) {
      const nextSyl = this.currentQuestion.syllables[this.syllableExpectedIndex];
      const correctLetter = this.letters.find(l => l.letter === nextSyl && l.isClickable);
      if (correctLetter) correctLetter.hint();
      return;
    }
    const correctLetter = this.letters.find(l => l.isCorrect && l.isClickable);
    if (correctLetter) {
      correctLetter.hint();
    }
  }

  clearLetters() {
    this.letters.forEach(letter => {
      gsap.killTweensOf(letter);
      gsap.killTweensOf(letter.scale);
      letter.destroy();
    });
    this.letters = [];
    this.currentQuestion = null;
    this.voiceMode = false;
    this.lettersSpoken.clear();
    this.syllableGameMode = false;
    this.syllableExpectedIndex = 0;
    this.encontreSyllableGameMode = false;
    this.remainingSyllables = [];
    if (this.wordText) {
      this.wordText.destroy();
      this.wordText = null;
    }
    if (this.slotsText) {
      this.slotsText.destroy();
      this.slotsText = null;
    }
  }

  areAllLettersGone() {
    return this.letters.every(l => !l.isClickable || l.state === 'correct');
  }
}
