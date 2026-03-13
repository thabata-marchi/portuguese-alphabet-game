import { Container, Text, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { Mascot } from './Mascot';

export class MenuScreen extends Container {
  constructor(stageWidth, stageHeight, sound) {
    super();
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.sound = sound;

    this.onPlayVogais = null;
    this.onPlayConsoantes = null;
    this.onPlaySilabas = null;
    this.onPlaySilabas2 = null;
    this.onPlayMath = null;
    this.onPlayEnglish = null;
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

    const scale = Math.min(1, this.stageWidth / 800);
    const titleFontSize = Math.round(Math.max(32, 64 * scale));
    const titleY = this.stageHeight * 0.25;

    // Title
    this.title = new Text({
      text: '🦁 ABC Safari',
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: titleFontSize,
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
    this.title.y = titleY;
    this.addChild(this.title);

    gsap.to(this.title.scale, {
      x: 1.05, y: 1.05,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    const subtitleFontSize = Math.max(16, Math.round(24 * scale));
    const subtitleY = this.stageHeight * 0.37;
    // Subtitle
    const subtitle = new Text({
      text: 'Aprenda as letras brincando!',
      style: {
        fontFamily: 'Comic Sans MS, Arial',
        fontSize: subtitleFontSize,
        fill: 0xBBBBBB
      }
    });
    subtitle.anchor.set(0.5);
    subtitle.x = this.stageWidth / 2;
    subtitle.y = subtitleY;
    this.addChild(subtitle);

    const vogaisY = this.stageHeight * 0.46;
    const consoantesY = this.stageHeight * 0.53;
    const silabasY = this.stageHeight * 0.60;
    const silabas2Y = this.stageHeight * 0.67;
    const mathY = this.stageHeight * 0.74;
    const englishY = this.stageHeight * 0.81;
    const micY = this.stageHeight * 0.88;

    const vogaisBtn = this._createButton('🔤 Vogais', this.stageWidth / 2, vogaisY, 0x27AE60, scale);
    vogaisBtn.on('pointerdown', async () => {
      await this.sound.unlock();
      this.sound.play('click');
      gsap.killTweensOf(this.title.scale);
      if (this.onPlayVogais) this.onPlayVogais();
    });
    this.addChild(vogaisBtn);

    const consoantesBtn = this._createButton('📝 Consoantes', this.stageWidth / 2, consoantesY, 0x16A085, scale);
    consoantesBtn.on('pointerdown', async () => {
      await this.sound.unlock();
      this.sound.play('click');
      gsap.killTweensOf(this.title.scale);
      if (this.onPlayConsoantes) this.onPlayConsoantes();
    });
    this.addChild(consoantesBtn);

    const silabasBtn = this._createButton('📖 Sílabas I', this.stageWidth / 2, silabasY, 0x1ABC9C, scale);
    silabasBtn.on('pointerdown', async () => {
      await this.sound.unlock();
      this.sound.play('click');
      gsap.killTweensOf(this.title.scale);
      if (this.onPlaySilabas) this.onPlaySilabas();
    });
    this.addChild(silabasBtn);

    const silabas2Btn = this._createButton('📖 Sílabas II', this.stageWidth / 2, silabas2Y, 0x16A085, scale * 0.9);
    silabas2Btn.on('pointerdown', async () => {
      await this.sound.unlock();
      this.sound.play('click');
      gsap.killTweensOf(this.title.scale);
      if (this.onPlaySilabas2) this.onPlaySilabas2();
    });
    this.addChild(silabas2Btn);

    const mathBtn = this._createButton('🔢 Matemática', this.stageWidth / 2, mathY, 0x9B59B6, scale);
    mathBtn.on('pointerdown', async () => {
      await this.sound.unlock();
      this.sound.play('click');
      gsap.killTweensOf(this.title.scale);
      if (this.onPlayMath) this.onPlayMath();
    });
    this.addChild(mathBtn);

    const englishBtn = this._createButton('🇬🇧 English', this.stageWidth / 2, englishY, 0x2980B9, scale * 0.9);
    englishBtn.on('pointerdown', async () => {
      await this.sound.unlock();
      this.sound.play('click');
      gsap.killTweensOf(this.title.scale);
      if (this.onPlayEnglish) this.onPlayEnglish();
    });
    this.addChild(englishBtn);

    this.micBtn = this._createButton('🎤 Ativar Voz', this.stageWidth / 2, micY, 0xE74C3C, scale * 0.85);
    this.micBtn.on('pointerdown', async () => {
      await this.sound.unlock();
      this.sound.play('click');
      if (this.onActivateVoice) this.onActivateVoice();
    });
    this.addChild(this.micBtn);

    const mascotMargin = Math.max(60, this.stageWidth * 0.12);
    const mascot = new Mascot();
    mascot.x = this.stageWidth - mascotMargin;
    mascot.y = this.stageHeight - mascotMargin;
    mascot.scale.set(Math.min(1.2, 0.8 + scale * 0.4));
    this.addChild(mascot);
    mascot.wave();
    mascot.idle();
  }

  setVoiceActivated() {
    const scale = Math.min(1, this.stageWidth / 800);
    const w = Math.max(160, 240 * scale);
    const h = Math.max(36, 50 * scale);
    const micLabel = this.micBtn.getChildAt(1);
    micLabel.text = '🎤 Voz Ativada!';
    this.micBtn.getChildAt(0).clear();
    this.micBtn.getChildAt(0).roundRect(-w / 2, -h / 2, w, h, 15);
    this.micBtn.getChildAt(0).fill({ color: 0x2ECC71 });
  }

  showHint(message) {
    if (this._hintText) {
      this._hintText.destroy();
      gsap.killTweensOf(this._hintText);
    }
    const scale = Math.min(1, this.stageWidth / 800);
    const micY = this.stageHeight * 0.7;
    this._hintText = new Text({
      text: message,
      style: {
        fontFamily: 'Comic Sans MS, Arial',
        fontSize: Math.max(12, Math.round(16 * scale)),
        fill: 0xF39C12,
        wordWrap: true,
        wordWrapWidth: this.stageWidth - 80
      }
    });
    this._hintText.anchor.set(0.5);
    this._hintText.x = this.stageWidth / 2;
    this._hintText.y = micY + 45;
    this.addChild(this._hintText);
    gsap.delayedCall(5, () => {
      const hint = this._hintText;
      if (hint && hint.parent) {
        gsap.to(hint, { alpha: 0, duration: 0.3, onComplete: () => { hint.destroy(); this._hintText = null; } });
      }
    });
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
