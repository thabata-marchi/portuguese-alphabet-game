import { Container, Graphics, Text } from 'pixi.js';
import { gsap } from 'gsap';
import { Character } from './Character';

export class Mascot extends Character {
  constructor() {
    super();
    this._createVisual();
  }

  _createVisual() {
    // Mascot body (a friendly little lion)
    const body = new Graphics();

    // Mane
    body.circle(0, -5, 35);
    body.fill({ color: 0xE67E22 });

    // Head
    body.circle(0, -5, 25);
    body.fill({ color: 0xF39C12 });

    // Eyes
    body.circle(-8, -10, 5);
    body.fill({ color: 0xFFFFFF });
    body.circle(-8, -10, 3);
    body.fill({ color: 0x2C3E50 });

    body.circle(8, -10, 5);
    body.fill({ color: 0xFFFFFF });
    body.circle(8, -10, 3);
    body.fill({ color: 0x2C3E50 });

    // Nose
    body.circle(0, -2, 4);
    body.fill({ color: 0xE74C3C });

    // Mouth (smile)
    body.arc(0, 2, 10, 0, Math.PI, false);
    body.stroke({ color: 0x2C3E50, width: 2 });

    // Body
    body.roundRect(-20, 20, 40, 35, 10);
    body.fill({ color: 0xF39C12 });

    this.addChild(body);
    this.bodyGraphics = body;

    // Speech bubble
    this.speechBubble = new Container();
    this.speechBubble.visible = false;

    const bubble = new Graphics();
    bubble.roundRect(-80, -50, 160, 40, 10);
    bubble.fill({ color: 0xFFFFFF, alpha: 0.95 });
    bubble.stroke({ color: 0x2C3E50, width: 2 });
    // Triangle pointing down
    bubble.moveTo(-5, -10);
    bubble.lineTo(0, 0);
    bubble.lineTo(5, -10);
    bubble.fill({ color: 0xFFFFFF });
    this.speechBubble.addChild(bubble);

    this.speechText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: 14,
        fill: 0x2C3E50,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 140
      }
    });
    this.speechText.anchor.set(0.5);
    this.speechText.y = -30;
    this.speechBubble.addChild(this.speechText);
    this.speechBubble.y = -45;

    this.addChild(this.speechBubble);
  }

  say(text, duration = 2) {
    this.speechText.text = text;
    this.speechBubble.visible = true;
    this.speechBubble.alpha = 0;
    this.speechBubble.scale.set(0.5);

    gsap.killTweensOf(this.speechBubble);
    gsap.killTweensOf(this.speechBubble.scale);

    gsap.to(this.speechBubble, { alpha: 1, duration: 0.2 });
    gsap.to(this.speechBubble.scale, {
      x: 1, y: 1,
      duration: 0.3,
      ease: 'back.out'
    });

    gsap.to(this.speechBubble, {
      alpha: 0,
      delay: duration,
      duration: 0.3,
      onComplete: () => {
        this.speechBubble.visible = false;
      }
    });
  }

  celebrate() {
    this.setState('celebrating');
    this.killTimeline();

    this.timeline.to(this, {
      y: this.y - 20,
      duration: 0.2,
      yoyo: true,
      repeat: 3,
      ease: 'power2.out'
    });

    this.say('Muito bem! 🌟');
  }

  encourage() {
    this.setState('encouraging');
    this.killTimeline();

    this.timeline.to(this, {
      rotation: 0.1,
      duration: 0.2,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.rotation = 0;
      }
    });

    const phrases = [
      'Tente de novo!',
      'Você consegue!',
      'Quase lá!',
      'Vamos lá!'
    ];
    this.say(phrases[Math.floor(Math.random() * phrases.length)]);
  }

  idle() {
    this.setState('idle');
    this.killTimeline();

    gsap.to(this.scale, {
      y: 1.03,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  wave() {
    this.say('Oi! Vamos aprender!', 3);

    gsap.to(this, {
      rotation: 0.15,
      duration: 0.3,
      yoyo: true,
      repeat: 3,
      ease: 'sine.inOut',
      onComplete: () => {
        this.rotation = 0;
      }
    });
  }

  destroy() {
    gsap.killTweensOf(this.speechBubble);
    gsap.killTweensOf(this.speechBubble.scale);
    super.destroy();
  }
}
