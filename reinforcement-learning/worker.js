/**
 * Web Worker for RL processing in the background
 *
 * Receives game events and processes Q-Learning updates
 * without blocking the main thread (UI)
 */

import { QLearningAgent } from './agent';

const agent = new QLearningAgent();

self.onmessage = function(event) {
  const { type, data } = event.data;

  switch (type) {
    case 'init':
      agent.load();
      self.postMessage({ type: 'ready', data: agent.getStats() });
      break;

    case 'choose_action':
      const action = agent.chooseAction(data.state);
      self.postMessage({ type: 'action', data: { action } });
      break;

    case 'update':
      agent.update(data.state, data.action, data.reward, data.nextState);
      agent.save();
      self.postMessage({ type: 'updated', data: agent.getStats() });
      break;

    case 'get_stats':
      self.postMessage({ type: 'stats', data: agent.getStats() });
      break;

    case 'reset':
      agent.reset();
      self.postMessage({ type: 'reset', data: agent.getStats() });
      break;
  }
};
