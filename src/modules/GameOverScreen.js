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

    const scale = Math.min(1, this.stageWidth / 800);

    const bg = new Graphics();
    bg.rect(0, 0, this.stageWidth, this.stageHeight);
    bg.fill({ color: isVictory ? 0x2C3E50 : 0x1A1A2E });
    this.addChild(bg);

    const titleFontSize = Math.max(28, Math.round(48 * scale));
    const titleY = this.stageHeight * 0.25;
    const title = new Text({
      text: isVictory ? '🏆 Parabéns!' : 'Continue Praticando!',
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: titleFontSize,
        fontWeight: 'bold',
        fill: isVictory ? 0xFFD700 : 0xFFFFFF,
        dropShadow: { color: 0x000000, blur: 6, distance: 3 }
      }
    });
    title.anchor.set(0.5);
    title.x = this.stageWidth / 2;
    title.y = titleY;
    this.addChild(title);

    const statsFontSize = Math.max(20, Math.round(32 * scale));
    const statsY = this.stageHeight * 0.42;
    const statsText = new Text({
      text: `⭐ Estrelas: ${stars}`,
      style: {
        fontFamily: 'Comic Sans MS, Arial',
        fontSize: statsFontSize,
        fill: 0xFFD700
      }
    });
    statsText.anchor.set(0.5);
    statsText.x = this.stageWidth / 2;
    statsText.y = statsY;
    this.addChild(statsText);

    const replayY = this.stageHeight * 0.63;
    const menuY = this.stageHeight * 0.75;
    const replayBtn = this._createButton('🔄 Jogar de Novo', this.stageWidth / 2, replayY, 0x27AE60, scale);
    replayBtn.on('pointerdown', () => {
      if (this.onReplay) this.onReplay();
    });
    this.addChild(replayBtn);

    const menuBtn = this._createButton('🏠 Menu', this.stageWidth / 2, menuY, 0x3498DB, scale);
    menuBtn.on('pointerdown', () => {
      if (this.onMenu) this.onMenu();
    });
    this.addChild(menuBtn);

    if (isVictory) {
      this.sound.play('levelUp');
      this.sound.speakText('Parabéns! Você é incrível!');
    }
  }

  _createButton(text, x, y, color, scale = 1) {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.x = x;
    btn.y = y;

    const w = Math.max(160, 240 * scale);
    const h = Math.max(36, 50 * scale);
    const r = Math.max(10, 15 * scale);
    const bg = new Graphics();
    bg.roundRect(-w / 2, -h / 2, w, h, r);
    bg.fill({ color });
    bg.stroke({ color: 0xFFFFFF, width: 2, alpha: 0.5 });
    btn.addChild(bg);

    const fontSize = Math.max(16, Math.round(24 * scale));
    const label = new Text({
      text,
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize,
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
