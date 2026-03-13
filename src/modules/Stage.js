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
    this.onAnswer = null; // callback: (isCorrect, letter) => {}

    this._createBackground();
  }

  _createBackground() {
    // Gradient sky
    const sky = new Graphics();
    sky.rect(0, 0, this.stageWidth, this.stageHeight);
    sky.fill({ color: 0x87CEEB });
    this.addChild(sky);

    // Decorative clouds
    for (let i = 0; i < 4; i++) {
      const cloud = this._createCloud();
      cloud.x = randomBetween(50, this.stageWidth - 50);
      cloud.y = randomBetween(80, 200);
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

    // Grass at the bottom
    const grass = new Graphics();
    grass.rect(0, this.stageHeight - 80, this.stageWidth, 80);
    grass.fill({ color: 0x27AE60 });
    this.addChild(grass);

    // Grass details
    const grassDetail = new Graphics();
    for (let x = 0; x < this.stageWidth; x += 20) {
      const h = randomBetween(10, 30);
      grassDetail.moveTo(x, this.stageHeight - 80);
      grassDetail.lineTo(x + 5, this.stageHeight - 80 - h);
      grassDetail.lineTo(x + 10, this.stageHeight - 80);
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

    const { options, correctAnswer } = question;
    const spacing = this.stageWidth / (options.length + 1);

    options.forEach((letterText, index) => {
      const letter = new Letter(letterText, this.stageWidth, this.stageHeight);
      letter.isCorrect = (letterText === correctAnswer);
      letter.setSpeed(speed);

      // Distributed initial position
      const startX = spacing * (index + 1);
      const startY = randomBetween(120, 400);

      letter.on('pointerdown', () => this._onLetterClick(letter));

      this.addChild(letter);
      this.letters.push(letter);

      // Spawn with staggered delay
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
    const matchingLetter = this.letters.find(
      l => l.letter.toUpperCase() === spokenLetter.toUpperCase() && l.isClickable
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
  }

  areAllLettersGone() {
    return this.letters.every(l => !l.isClickable || l.state === 'correct');
  }
}
