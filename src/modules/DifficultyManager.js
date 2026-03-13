import levelsData from '../data/levels.json';

const ACTION_ADJUSTMENTS = {
  speed_down: (params) => {
    params.speed = Math.max(1, params.speed - 1);
  },
  speed_up: (params) => {
    params.speed = Math.min(8, params.speed + 1);
  },
  less_options: (params) => {
    params.optionsCount = Math.max(2, params.optionsCount - 1);
  },
  more_options: (params) => {
    params.optionsCount = Math.min(5, params.optionsCount + 1);
  },
  more_time: (params) => {
    params.time = Math.min(20, params.time + 2);
  },
  less_time: (params) => {
    params.time = Math.max(8, params.time - 2);
  }
};

export class DifficultyManager {
  constructor(rlAgent = null) {
    this.rlAgent = rlAgent;

    this.correctCount = 0;
    this.wrongCount = 0;
    this.attempts = 0;
    this.responseTimes = [];
    this.currentLevel = 0;

    this.gameParams = {
      speed: 3,
      optionsCount: 3,
      time: 15
    };
  }

  resetForLevel(levelIndex) {
    this.currentLevel = levelIndex;
    this.correctCount = 0;
    this.wrongCount = 0;

    const level = levelsData[levelIndex];
    if (!level) return;

    this.gameParams = {
      speed: level.speed,
      optionsCount: level.optionsCount,
      time: level.time
    };

    if (this.rlAgent) {
      const action = this.rlAgent.chooseAction(this._getState());
      this._applyAction(action);
    }
  }

  recordCorrect(responseTime) {
    this.correctCount++;
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 10) this.responseTimes.shift();

    if (this.rlAgent) {
      const reward = this.attempts === 1 ? 1.0 : 0.5;
      this._updateRL(reward);
    }
  }

  recordWrong() {
    this.wrongCount++;
  }

  recordTimeout() {
    if (this.rlAgent) {
      this._updateRL(-0.5);
    }
  }

  recordLevelComplete() {
    const level = levelsData[this.currentLevel];
    if (!level) return;

    const accuracy = this.correctCount / level.waves;
    if (this.rlAgent && accuracy > 0.9) {
      this._updateRL(-0.3);
    }
  }

  setAttempts(attempts) {
    this.attempts = attempts;
  }

  resetProgress() {
    this.responseTimes = [];
  }

  _getState() {
    const recentAccuracy = this.responseTimes.length > 0
      ? this.correctCount / Math.max(this.correctCount + this.wrongCount, 1)
      : 0.5;

    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 5;

    return {
      accuracy: Math.round(recentAccuracy * 10) / 10,
      responseTime: avgResponseTime < 3 ? 'fast' : avgResponseTime < 7 ? 'medium' : 'slow',
      level: this.currentLevel,
      attempts: this.attempts
    };
  }

  _updateRL(reward) {
    if (!this.rlAgent) return;

    const state = this._getState();
    const action = this.rlAgent.chooseAction(state);
    this.rlAgent.update(state, action, reward, this._getState());
    this.rlAgent.save();
    this._applyAction(action);
  }

  _applyAction(action) {
    const adjustment = ACTION_ADJUSTMENTS[action];
    if (adjustment) {
      adjustment(this.gameParams);
    }
  }
}
