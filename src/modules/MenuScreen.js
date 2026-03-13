import { Container, Text, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { Mascot } from './Mascot';

export class MenuScreen extends Container {
  constructor(stageWidth, stageHeight, sound) {
    super();
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.sound = sound;

    this.onPlay = null;
    this.onActivateVoice = null;

    this._create();
  }

  _create() {
    // Background
    const bg = new Graphics();
    bg.rect(0, 0, this.stageWidth, this.stageHeight);
    bg.fill({ color: 0x2C3E50 });
    this.addChild(bg);

    // Decorative stars in the background
    for (let i = 0; i < 20; i++) {
      const star = new Graphics();
      star.star(
        Math.random() * this.stageWidth,
        Math.random() * this.stageHeight,
        5, 3 + Math.random() * 5, 4
      );
      star.fill({ color: 0xFFD700, alpha: 0.3 + Math.random() * 0.5 });
      this.addChild(star);

      gsap.to(star, {
        alpha: 0.1,
        duration: 1 + Math.random() * 2,
        yoyo: true,
        repeat: -1
      });
    }

    // Title
    this.title = new Text({
      text: '🦁 ABC Safari',
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: 64,
        fontWeight: 'bold',
        fill: 0xFFD700,
        dropShadow: {
          color: 0x000000,
          blur: 8,
          distance: 4
        }
      }
    });
    this.title.anchor.set(0.5);
    this.title.x = this.stageWidth / 2;
    this.title.y = 150;
    this.addChild(this.title);

    gsap.to(this.title.scale, {
      x: 1.05, y: 1.05,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Subtitle
    const subtitle = new Text({
      text: 'Aprenda as letras brincando!',
      style: {
        fontFamily: 'Comic Sans MS, Arial',
        fontSize: 24,
        fill: 0xBBBBBB
      }
    });
    subtitle.anchor.set(0.5);
    subtitle.x = this.stageWidth / 2;
    subtitle.y = 220;
    this.addChild(subtitle);

    // Play button
    const playBtn = this._createButton('🎮 Jogar!', this.stageWidth / 2, 340, 0x27AE60);
    playBtn.on('pointerdown', () => {
      this.sound.play('click');
      gsap.killTweensOf(this.title.scale);
      if (this.onPlay) this.onPlay();
    });
    this.addChild(playBtn);

    // Microphone button
    this.micBtn = this._createButton('🎤 Ativar Voz', this.stageWidth / 2, 420, 0xE74C3C);
    this.micBtn.on('pointerdown', () => {
      this.sound.play('click');
      if (this.onActivateVoice) this.onActivateVoice();
    });
    this.addChild(this.micBtn);

    // Mascot on menu
    const mascot = new Mascot();
    mascot.x = this.stageWidth - 100;
    mascot.y = this.stageHeight - 100;
    mascot.scale.set(1.2);
    this.addChild(mascot);
    mascot.wave();
    mascot.idle();
  }

  setVoiceActivated() {
    const micLabel = this.micBtn.getChildAt(1);
    micLabel.text = '🎤 Voz Ativada!';
    this.micBtn.getChildAt(0).clear();
    this.micBtn.getChildAt(0).roundRect(-120, -25, 240, 50, 15);
    this.micBtn.getChildAt(0).fill({ color: 0x2ECC71 });
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
