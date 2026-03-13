import englishContentData from '../data/english-content.json';
import { shuffleArray } from '../libs/utils';

// TODO: Animals in development. Currently only colors are active (english-levels.json has 2 levels).
// When animals are ready: add animals_basic and animals_extended to english-content.json and
// add corresponding level entries to english-levels.json. See docs/english-animals-TODO.md for structure.

/**
 * Generates questions for the English mode (colors; animals planned).
 * Returns the same shape as QuestionManager plus optionType and colorMap when applicable.
 */
export class EnglishQuestionManager {
  constructor() {
    this.content = englishContentData.levels;
    this.currentContentKey = null;
    this.usedItems = [];
  }

  setContent(contentKey) {
    this.currentContentKey = contentKey;
    this.usedItems = [];
  }

  generateQuestion(optionsCount) {
    const levelContent = this.content[this.currentContentKey];
    if (!levelContent) return null;

    const items = levelContent.items;

    const available = items.filter(item => !this.usedItems.includes(item));
    const pool = available.length > 0 ? available : items;
    const correctAnswer = pool[Math.floor(Math.random() * pool.length)];

    this.usedItems.push(correctAnswer);
    if (this.usedItems.length >= items.length) {
      this.usedItems = [];
    }

    const distractors = items.filter(item => item !== correctAnswer);
    const shuffledDistractors = shuffleArray(distractors);
    const selectedDistractors = shuffledDistractors.slice(0, optionsCount - 1);

    const options = shuffleArray([correctAnswer, ...selectedDistractors]);

    const prompt = levelContent.prompts[correctAnswer]
      || `Find: ${correctAnswer}!`;

    const result = {
      correctAnswer,
      options,
      prompt,
      optionType: levelContent.optionType || 'text'
    };

    if (levelContent.optionType === 'color' && levelContent.colorMap) {
      result.colorMap = levelContent.colorMap;
    }

    return result;
  }

  getContentTitle() {
    const levelContent = this.content[this.currentContentKey];
    return levelContent ? levelContent.title : '';
  }
}
