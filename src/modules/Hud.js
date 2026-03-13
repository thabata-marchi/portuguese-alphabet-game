import { Container, Text, Graphics } from 'pixi.js';
import { gsap } from 'gsap';

export class Hud extends Container {
  constructor(stageWidth, stageHeight) {
    super();
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this._createElements();
  }

  _createElements() {
    // Top bar with background
    const topBar = new Graphics();
    topBar.rect(0, 0, this.stageWidth, 60);
    topBar.fill({ color: 0x2C3E50, alpha: 0.85 });
    this.addChild(topBar);

    // Question text
    this.questionText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: 28,
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
    this.questionText.y = 30;
    this.addChild(this.questionText);

    // Stars (score)
    this.starsText = new Text({
      text: '⭐ 0',
      style: {
        fontFamily: 'Arial',
        fontSize: 22,
        fill: 0xFFD700,
        fontWeight: 'bold'
      }
    });
    this.starsText.x = 15;
    this.starsText.y = 15;
    this.addChild(this.starsText);

    // Level
    this.levelText = new Text({
      text: 'Nível 1',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xBBBBBB
      }
    });
    this.levelText.anchor.set(1, 0);
    this.levelText.x = this.stageWidth - 15;
    this.levelText.y = 18;
    this.addChild(this.levelText);

    // Progress bar (wave)
    this.progressBar = new Graphics();
    this.progressBar.y = 55;
    this.addChild(this.progressBar);

    // Microphone button
    this.micButton = this._createMicButton();
    this.micButton.x = this.stageWidth - 50;
    this.micButton.y = this.stageHeight - 50;
    this.addChild(this.micButton);

    // Feedback text (center of screen)
    this.feedbackText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, Arial',
        fontSize: 42,
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

  _createMicButton() {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.circle(0, 0, 25);
    bg.fill({ color: 0xE74C3C, alpha: 0.9 });
    bg.stroke({ color: 0xFFFFFF, width: 2 });
    btn.addChild(bg);
    btn.bg = bg;

    const micIcon = new Text({
      text: '🎤',
      style: { fontSize: 22 }
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
    const progress = current / total;

    // Background
    this.progressBar.rect(0, 0, barWidth, 5);
    this.progressBar.fill({ color: 0x34495E });

    // Progress
    this.progressBar.rect(0, 0, barWidth * progress, 5);
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
    this.micButton.bg.clear();
    this.micButton.bg.circle(0, 0, 25);
    this.micButton.bg.fill({ color: active ? 0x2ECC71 : 0xE74C3C, alpha: 0.9 });
    this.micButton.bg.stroke({ color: 0xFFFFFF, width: 2 });
  }
}
