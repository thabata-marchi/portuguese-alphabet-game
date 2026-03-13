import { Container, Text, Graphics } from 'pixi.js';
import { gsap } from 'gsap';

export class Hud extends Container {
  constructor(stageWidth, stageHeight) {
    super();
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.onBackToMenu = null;
    this._createElements();
  }

  _createElements() {
    const scale = Math.min(1, this.stageWidth / 800);
    const topBarHeight = Math.max(44, 60 * scale);
    const padding = Math.max(10, 15 * scale);

    // Top bar with background
    const topBar = new Graphics();
    topBar.rect(0, 0, this.stageWidth, topBarHeight);
    topBar.fill({ color: 0x2C3E50, alpha: 0.85 });
    this.addChild(topBar);

    const questionFontSize = Math.max(18, Math.round(28 * scale));
    this.questionText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: questionFontSize,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        align: 'center',
        dropShadow: {
          color: 0x000000,
          blur: 3,
          distance: 1
        }
      }
    });
    this.questionText.anchor.set(0.5, 0.5);
    this.questionText.x = this.stageWidth / 2;
    this.questionText.y = topBarHeight / 2;
    this.addChild(this.questionText);

    const smallFontSize = Math.max(14, Math.round(22 * scale));
    const levelFontSize = Math.max(12, Math.round(18 * scale));
    const backBtnRadius = Math.max(18, 25 * scale);
    this.starsText = new Text({
      text: '⭐ 0',
      style: {
        fontFamily: 'Arial',
        fontSize: smallFontSize,
        fill: 0xFFD700,
        fontWeight: 'bold'
      }
    });
    this.starsText.x = backBtnRadius * 2 + padding * 2;
    this.starsText.y = padding;
    this.addChild(this.starsText);

    this.levelText = new Text({
      text: 'Nível 1',
      style: {
        fontFamily: 'Arial',
        fontSize: levelFontSize,
        fill: 0xBBBBBB
      }
    });
    this.levelText.anchor.set(1, 0);
    this.levelText.x = this.stageWidth - padding;
    this.levelText.y = padding;
    this.addChild(this.levelText);

    this.progressBar = new Graphics();
    this.progressBar.y = topBarHeight - 5;
    this.addChild(this.progressBar);

    this.backButton = this._createBackButton(scale);
    this.backButton.x = backBtnRadius + padding;
    this.backButton.y = topBarHeight / 2;
    this.backButton.on('pointerdown', () => {
      if (this.onBackToMenu) this.onBackToMenu();
    });
    this.addChild(this.backButton);

    const micMargin = Math.max(24, 50 * scale);
    this.micButton = this._createMicButton(scale);
    this.micButton.x = this.stageWidth - micMargin;
    this.micButton.y = this.stageHeight - micMargin;
    this.addChild(this.micButton);

    const feedbackFontSize = Math.max(28, Math.round(42 * scale));
    this.feedbackText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: feedbackFontSize,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        align: 'center',
        dropShadow: {
          color: 0x000000,
          blur: 6,
          distance: 3
        }
      }
    });
    this.feedbackText.anchor.set(0.5);
    this.feedbackText.x = this.stageWidth / 2;
    this.feedbackText.y = this.stageHeight / 2;
    this.feedbackText.visible = false;
    this.addChild(this.feedbackText);
  }

  _createBackButton(scale = 1) {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const radius = Math.max(18, 25 * scale);
    const bg = new Graphics();
    bg.circle(0, 0, radius);
    bg.fill({ color: 0x3498DB, alpha: 0.9 });
    bg.stroke({ color: 0xFFFFFF, width: 2, alpha: 0.6 });
    btn.addChild(bg);

    const iconSize = Math.max(18, 24 * scale);
    const arrow = new Text({
      text: '←',
      style: {
        fontFamily: 'Arial Rounded MT Bold, Arial',
        fontSize: iconSize,
        fontWeight: 'bold',
        fill: 0xFFFFFF
      }
    });
    arrow.anchor.set(0.5);
    btn.addChild(arrow);

    btn.on('pointerover', () => {
      gsap.to(btn.scale, { x: 1.1, y: 1.1, duration: 0.15 });
    });
    btn.on('pointerout', () => {
      gsap.to(btn.scale, { x: 1, y: 1, duration: 0.15 });
    });

    return btn;
  }

  _createMicButton(scale = 1) {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const radius = Math.max(18, 25 * scale);
    const bg = new Graphics();
    bg.circle(0, 0, radius);
    bg.fill({ color: 0xE74C3C, alpha: 0.9 });
    bg.stroke({ color: 0xFFFFFF, width: 2 });
    btn.addChild(bg);
    btn.bg = bg;
    btn.radius = radius;

    const iconSize = Math.max(16, 22 * scale);
    const micIcon = new Text({
      text: '🎤',
      style: { fontSize: iconSize }
    });
    micIcon.anchor.set(0.5);
    btn.addChild(micIcon);

    return btn;
  }

  setQuestion(text) {
    this.questionText.text = text;
  }

  setStars(count) {
    this.starsText.text = `⭐ ${count}`;
  }

  setLevel(levelNum, title) {
    this.levelText.text = `${title} (${levelNum})`;
  }

  setProgress(current, total) {
    this.progressBar.clear();
    const barWidth = this.stageWidth;
    const barHeight = Math.max(4, 5 * Math.min(1, this.stageWidth / 800));
    const progress = current / total;

    this.progressBar.rect(0, 0, barWidth, barHeight);
    this.progressBar.fill({ color: 0x34495E });
    this.progressBar.rect(0, 0, barWidth * progress, barHeight);
    this.progressBar.fill({ color: 0x2ECC71 });
  }

  showFeedback(text, color = 0xFFFFFF) {
    this.feedbackText.text = text;
    this.feedbackText.style.fill = color;
    this.feedbackText.visible = true;
    this.feedbackText.alpha = 1;
    this.feedbackText.scale.set(0.5);

    gsap.to(this.feedbackText.scale, {
      x: 1, y: 1,
      duration: 0.3,
      ease: 'back.out'
    });
    gsap.to(this.feedbackText, {
      alpha: 0,
      delay: 1.2,
      duration: 0.5,
      onComplete: () => {
        this.feedbackText.visible = false;
      }
    });
  }

  setMicActive(active) {
    const r = this.micButton.radius ?? 25;
    this.micButton.bg.clear();
    this.micButton.bg.circle(0, 0, r);
    this.micButton.bg.fill({ color: active ? 0x2ECC71 : 0xE74C3C, alpha: 0.9 });
    this.micButton.bg.stroke({ color: 0xFFFFFF, width: 2 });
  }
}
