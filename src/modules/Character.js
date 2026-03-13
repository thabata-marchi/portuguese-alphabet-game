import { Container } from 'pixi.js';
import { gsap } from 'gsap';

export class Character extends Container {
  constructor() {
    super();
    this.timeline = gsap.timeline();
    this.state = 'idle';
  }

  setState(state) {
    this.state = state;
  }

  killTimeline() {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = gsap.timeline();
    }
  }

  destroy() {
    this.killTimeline();
    super.destroy({ children: true });
  }
}
