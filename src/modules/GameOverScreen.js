import { Container, Text, Graphics } from 'pixi.js';
import { gsap } from 'gsap';

export class GameOverScreen extends Container {
  constructor(stageWidth, stageHeight, sound) {
    super();
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.sound = sound;

    this.onReplay = null;
    this.onMenu = null;
  }

  show(isVictory, stars) {
    this.removeChildren();

    const bg = new Graphics();
    bg.rect(0, 0, this.stageWidth, this.stageHeight);
    bg.fill({ color: isVictory ? 0x2C3E50 : 0x1A1A2E });
    this.addChild(bg);

    const title = new Text({
      text: isVictory ? '🏆 Parabéns!' : 'Continue Praticando!',
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: 48,
        fontWeight: 'bold',
        fill: isVictory ? 0xFFD700 : 0xFFFFFF,
        dropShadow: { color: 0x000000, blur: 6, distance: 3 }
      }
    });
    title.anchor.set(0.5);
    title.x = this.stageWidth / 2;
    title.y = 150;
    this.addChild(title);

    const statsText = new Text({
      text: `⭐ Estrelas: ${stars}`,
      style: {
        fontFamily: 'Comic Sans MS, Arial',
        fontSize: 32,
        fill: 0xFFD700
      }
    });
    statsText.anchor.set(0.5);
    statsText.x = this.stageWidth / 2;
    statsText.y = 250;
    this.addChild(statsText);

    // Play Again button
    const replayBtn = this._createButton('🔄 Jogar de Novo', this.stageWidth / 2, 380, 0x27AE60);
    replayBtn.on('pointerdown', () => {
      if (this.onReplay) this.onReplay();
    });
    this.addChild(replayBtn);

    // Menu button
    const menuBtn = this._createButton('🏠 Menu', this.stageWidth / 2, 450, 0x3498DB);
    menuBtn.on('pointerdown', () => {
      if (this.onMenu) this.onMenu();
    });
    this.addChild(menuBtn);

    if (isVictory) {
      this.sound.play('levelUp');
      this.sound.speakText('Parabéns! Você é incrível!');
    }
  }

  _createButton(text, x, y, color) {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.x = x;
    btn.y = y;

    const bg = new Graphics();
    bg.roundRect(-120, -25, 240, 50, 15);
    bg.fill({ color });
    bg.stroke({ color: 0xFFFFFF, width: 2, alpha: 0.5 });
    btn.addChild(bg);

    const label = new Text({
      text,
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0xFFFFFF
      }
    });
    label.anchor.set(0.5);
    btn.addChild(label);

    btn.on('pointerover', () => {
      gsap.to(btn.scale, { x: 1.1, y: 1.1, duration: 0.15 });
    });
    btn.on('pointerout', () => {
      gsap.to(btn.scale, { x: 1, y: 1, duration: 0.15 });
    });

    return btn;
  }
}
