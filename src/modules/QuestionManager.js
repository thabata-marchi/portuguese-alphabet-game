import contentData from '../data/content.json';
import { shuffleArray } from '../libs/utils';

export class QuestionManager {
  constructor() {
    this.content = contentData.levels;
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

    // Select the correct answer (prioritizes unused items)
    const available = items.filter(item => !this.usedItems.includes(item));
    const pool = available.length > 0 ? available : items;
    const correctAnswer = pool[Math.floor(Math.random() * pool.length)];

    this.usedItems.push(correctAnswer);
    if (this.usedItems.length >= items.length) {
      this.usedItems = [];
    }

    // Select distractors (wrong answers)
    const distractors = items
      .filter(item => item !== correctAnswer);
    const shuffledDistractors = shuffleArray(distractors);
    const selectedDistractors = shuffledDistractors.slice(0, optionsCount - 1);

    // Build options and shuffle
    const options = shuffleArray([correctAnswer, ...selectedDistractors]);

    // Question text
    const prompt = levelContent.prompts[correctAnswer]
      || `Encontre: ${correctAnswer}!`;

    return {
      correctAnswer,
      options,
      prompt
    };
  }

  /**
   * Gera uma lista de letras para o modo "Fale todas as letras" (voz ativada).
   * Só usa itens de uma letra (níveis de sílabas/palavras ficam no modo normal).
   * @param {number} count - Quantidade de letras a mostrar
   * @returns {{ letters: string[] } | null}
   */
  generateLettersForVoice(count) {
    const levelContent = this.content[this.currentContentKey];
    if (!levelContent?.items?.length) return null;

    const singleLetters = levelContent.items.filter((item) => item.length === 1);
    if (singleLetters.length === 0) return null;

    const shuffled = shuffleArray([...singleLetters]);
    const letters = shuffled.slice(0, Math.min(count, singleLetters.length));

    return { letters };
  }

  getContentTitle() {
    const levelContent = this.content[this.currentContentKey];
    return levelContent ? levelContent.title : '';
  }
}
