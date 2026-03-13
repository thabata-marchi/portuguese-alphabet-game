import { Container, Graphics, Text } from 'pixi.js';
import { gsap } from 'gsap';
import { Letter } from './Letter';
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

    const { options, correctAnswer } = question;
    const spacing = this.stageWidth / (options.length + 1);

    options.forEach((letterText, index) => {
      const letter = new Letter(letterText, this.stageWidth, this.stageHeight);
      letter.isCorrect = (letterText === correctAnswer);
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
  }

  areAllLettersGone() {
    return this.letters.every(l => !l.isClickable || l.state === 'correct');
  }
}
