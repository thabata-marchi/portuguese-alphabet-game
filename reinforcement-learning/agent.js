/**
 * Adaptive Q-Learning Agent
 *
 * Observes the child's performance and adjusts game difficulty
 * to keep accuracy in the "zone of proximal development" (60-80%).
 *
 * States: combination of (accuracy, responseTime, level)
 * Actions: speed_up, speed_down, more_options, less_options, more_time, less_time
 * Reward: based on engagement and accuracy rate
 */

const ACTIONS = [
  'speed_up',
  'speed_down',
  'more_options',
  'less_options',
  'more_time',
  'less_time'
];

const STORAGE_KEY = 'abc_safari_rl_agent';

export class QLearningAgent {
  constructor(options = {}) {
    this.learningRate = options.learningRate || 0.1;      // α - learning rate
    this.discountFactor = options.discountFactor || 0.95;  // γ - discount factor
    this.epsilon = options.epsilon || 0.3;                 // ε - exploration rate
    this.epsilonDecay = options.epsilonDecay || 0.995;     // Epsilon decay
    this.minEpsilon = options.minEpsilon || 0.05;          // Minimum epsilon

    this.qTable = {};       // Q table: { stateKey: { action: value } }
    this.episodeCount = 0;  // Number of episodes (sessions)
  }

  /**
   * Converts game state to a string key for the Q table
   */
  _stateToKey(state) {
    // Discretize accuracy into bands: low (0-0.4), mid (0.5-0.7), high (0.8-1.0)
    let accuracyBin;
    if (state.accuracy <= 0.4) accuracyBin = 'low';
    else if (state.accuracy <= 0.7) accuracyBin = 'mid';
    else accuracyBin = 'high';

    return `${accuracyBin}_${state.responseTime}_${state.level}`;
  }

  /**
   * Ensures the state exists in the Q table
   */
  _ensureState(stateKey) {
    if (!this.qTable[stateKey]) {
      this.qTable[stateKey] = {};
      ACTIONS.forEach(action => {
        this.qTable[stateKey][action] = 0;
      });
    }
  }

  /**
   * Chooses an action using the epsilon-greedy policy
   */
  chooseAction(state) {
    const stateKey = this._stateToKey(state);
    this._ensureState(stateKey);

    // Exploration: random action
    if (Math.random() < this.epsilon) {
      return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    }

    // Exploitation: best known action
    const qValues = this.qTable[stateKey];
    let bestAction = ACTIONS[0];
    let bestValue = qValues[bestAction];

    ACTIONS.forEach(action => {
      if (qValues[action] > bestValue) {
        bestValue = qValues[action];
        bestAction = action;
      }
    });

    return bestAction;
  }

  /**
   * Updates the Q table based on experience
   *
   * Q(s,a) = Q(s,a) + α * [reward + γ * max(Q(s',a')) - Q(s,a)]
   */
  update(state, action, reward, nextState) {
    const stateKey = this._stateToKey(state);
    const nextStateKey = this._stateToKey(nextState);

    this._ensureState(stateKey);
    this._ensureState(nextStateKey);

    // Maximum value of next state
    const nextQValues = this.qTable[nextStateKey];
    const maxNextQ = Math.max(...Object.values(nextQValues));

    // Q-Learning update
    const currentQ = this.qTable[stateKey][action];
    const newQ = currentQ + this.learningRate * (
      reward + this.discountFactor * maxNextQ - currentQ
    );

    this.qTable[stateKey][action] = newQ;

    // Epsilon decay (explore less over time)
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    this.episodeCount++;
  }

  /**
   * Returns agent statistics
   */
  getStats() {
    return {
      episodeCount: this.episodeCount,
      epsilon: this.epsilon.toFixed(3),
      statesExplored: Object.keys(this.qTable).length,
      qTable: this.qTable
    };
  }

  /**
   * Saves the agent to localStorage
   */
  save() {
    try {
      const data = {
        qTable: this.qTable,
        epsilon: this.epsilon,
        episodeCount: this.episodeCount
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save RL agent:', e.message);
    }
  }

  /**
   * Loads the agent from localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.qTable = data.qTable || {};
        this.epsilon = data.epsilon || 0.3;
        this.episodeCount = data.episodeCount || 0;
        console.log(`RL Agent loaded: ${this.episodeCount} episodes, ε=${this.epsilon.toFixed(3)}`);
      }
    } catch (e) {
      console.warn('Could not load RL agent:', e.message);
    }
  }

  /**
   * Resets the agent (clears learning)
   */
  reset() {
    this.qTable = {};
    this.epsilon = 0.3;
    this.episodeCount = 0;
    localStorage.removeItem(STORAGE_KEY);
  }
}
