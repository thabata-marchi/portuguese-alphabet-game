import { Text, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { Character } from './Character';
import { randomBetween, randomVibrantColor } from '../libs/utils';

function getBounds(stageWidth, stageHeight) {
  return {
    x: { min: stageWidth * 0.075, max: stageWidth * 0.925 },
    y: { min: stageHeight * 0.13, max: stageHeight * 0.8 }
  };
}

export class Letter extends Character {
  constructor(letter, stageWidth, stageHeight) {
    super();
    this.letter = letter;
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.isCorrect = false;
    this.isClickable = true;
    this.speedScale = 5;

    this._createVisual();
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  _createVisual() {
    const balloonRadius = Math.max(24, Math.min(40, this.stageWidth * 0.05));
    const color = randomVibrantColor();
    const balloon = new Graphics();
    balloon.circle(0, 0, balloonRadius);
    balloon.fill({ color, alpha: 0.85 });
    balloon.stroke({ color: 0xFFFFFF, width: 3, alpha: 0.6 });
    this.addChild(balloon);
    this.balloon = balloon;

    const stringLen = balloonRadius + 40;
    const string = new Graphics();
    string.moveTo(0, balloonRadius);
    string.bezierCurveTo(5, balloonRadius + 15, -5, balloonRadius + 25, 0, stringLen);
    string.stroke({ color: 0x999999, width: 2 });
    this.addChild(string);

    const baseFontSize = Math.max(20, Math.min(38, this.stageWidth * 0.048));
    const letterFontSize = this.letter.length > 2 ? baseFontSize * 0.74 : baseFontSize;
    // Letter text
    const text = new Text({
      text: this.letter,
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: letterFontSize,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        align: 'center',
        dropShadow: {
          color: 0x000000,
          blur: 4,
          distance: 2
        }
      }
    });
    text.anchor.set(0.5);
    this.addChild(text);
    this.textDisplay = text;

    const hitW = Math.max(80, Math.min(100, this.stageWidth * 0.12));
    const hitH = Math.max(100, Math.min(130, hitW * 1.3));
    const hitArea = new Graphics();
    hitArea.rect(-hitW / 2, -hitW / 2, hitW, hitH);
    hitArea.fill({ color: 0xFF0000, alpha: 0 });
    this.addChild(hitArea);
  }

  spawn(x, y) {
    this.x = x;
    this.y = y;
    this.alpha = 0;
    this.scale.set(0);
    this.isClickable = true;
    this.setState('spawning');

    gsap.to(this, {
      alpha: 1,
      duration: 0.3,
      ease: 'back.out'
    });
    gsap.to(this.scale, {
      x: 1,
      y: 1,
      duration: 0.4,
      ease: 'back.out',
      onComplete: () => {
        this.setState('flying');
        this.randomFlight();
      }
    });
  }

  randomFlight() {
    if (this.state !== 'flying') return;

    const bounds = getBounds(this.stageWidth, this.stageHeight);
    let destX, destY;
    do {
      destX = randomBetween(bounds.x.min, bounds.x.max);
      destY = randomBetween(bounds.y.min, bounds.y.max);
    } while (
      Math.abs(destX - this.x) + Math.abs(destY - this.y) < Math.max(80, this.stageWidth * 0.19)
    );

    const speedMs = 3000 - (this.speedScale * 250);
    const duration = Math.max(speedMs, 800) / 1000;

    // Smooth balloon-like floating
    this.killTimeline();
    this.timeline = gsap.timeline({
      onComplete: () => this.randomFlight()
    });

    this.timeline.to(this, {
      x: destX,
      y: destY,
      duration: duration,
      ease: 'sine.inOut'
    });

    // Gentle sway while flying
    gsap.to(this, {
      rotation: 0.1,
      duration: 0.8,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  setSpeed(speed) {
    this.speedScale = speed;
  }

  correct() {
    this.isClickable = false;
    this.setState('correct');
    this.killTimeline();
    gsap.killTweensOf(this);

    // Celebration animation - grows and shines
    gsap.to(this.scale, {
      x: 1.5,
      y: 1.5,
      duration: 0.2,
      ease: 'back.out'
    });

    // Star particles (simple visual effect)
    for (let i = 0; i < 5; i++) {
      const star = new Graphics();
      star.star(0, 0, 5, 8, 4);
      star.fill({ color: 0xFFD700 });
      star.x = 0;
      star.y = 0;
      this.addChild(star);

      const angle = (Math.PI * 2 / 5) * i;
      gsap.to(star, {
        x: Math.cos(angle) * 60,
        y: Math.sin(angle) * 60,
        alpha: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => star.destroy()
      });
    }

    // Disappears after celebration
    gsap.to(this, {
      alpha: 0,
      y: this.y - 50,
      duration: 0.5,
      delay: 0.4,
      ease: 'power2.in'
    });
  }

  wrong() {
    if (!this.isClickable) return;

    // Shake animation
    const origX = this.x;
    gsap.to(this, {
      x: origX - 10,
      duration: 0.05,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.x = origX;
      }
    });

    // Red flash
    this.balloon.tint = 0xFF0000;
    gsap.delayedCall(0.3, () => {
      this.balloon.tint = 0xFFFFFF;
    });
  }

  hint() {
    // Flashes to indicate it's the correct answer
    gsap.to(this.scale, {
      x: 1.3,
      y: 1.3,
      duration: 0.3,
      yoyo: true,
      repeat: 3,
      ease: 'sine.inOut'
    });

    gsap.to(this.balloon, {
      alpha: 0.5,
      duration: 0.3,
      yoyo: true,
      repeat: 3
    });
  }

  destroy() {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.scale);
    if (this.balloon) gsap.killTweensOf(this.balloon);
    super.destroy();
  }
}
