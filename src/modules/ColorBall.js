import { Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { Character } from './Character';
import { randomBetween } from '../libs/utils';

function getBounds(stageWidth, stageHeight) {
  return {
    x: { min: stageWidth * 0.075, max: stageWidth * 0.925 },
    y: { min: stageHeight * 0.13, max: stageHeight * 0.8 }
  };
}

/**
 * Colored ball option for English color questions.
 * Same interaction contract as Letter: optionValue, isCorrect, correct(), wrong(), hint(), spawn().
 */
export class ColorBall extends Character {
  constructor(optionValue, colorHex, stageWidth, stageHeight) {
    super();
    this.letter = optionValue;
    this.optionValue = optionValue;
    this.colorHex = typeof colorHex === 'string' ? parseInt(colorHex, 16) : colorHex;
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
    const radius = Math.max(28, Math.min(44, this.stageWidth * 0.055));
    const ball = new Graphics();
    ball.circle(0, 0, radius);
    ball.fill({ color: this.colorHex, alpha: 0.9 });
    ball.stroke({ color: 0xFFFFFF, width: 3, alpha: 0.7 });
    this.addChild(ball);
    this.balloon = ball;

    const hitSize = Math.max(90, Math.min(110, this.stageWidth * 0.14));
    const hitArea = new Graphics();
    hitArea.rect(-hitSize / 2, -hitSize / 2, hitSize, hitSize);
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

    this.killTimeline();
    this.timeline = gsap.timeline({
      onComplete: () => this.randomFlight()
    });

    this.timeline.to(this, {
      x: destX,
      y: destY,
      duration,
      ease: 'sine.inOut'
    });

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

    gsap.to(this.scale, {
      x: 1.5,
      y: 1.5,
      duration: 0.2,
      ease: 'back.out'
    });

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

    this.balloon.tint = 0xFF0000;
    gsap.delayedCall(0.3, () => {
      this.balloon.tint = 0xFFFFFF;
    });
  }

  hint() {
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
