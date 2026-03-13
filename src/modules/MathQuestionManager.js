import { shuffleArray } from '../libs/utils';

/**
 * Gera perguntas de soma para o jogo de matemática (público infantil).
 * Os balões mostram o resultado; a criança escolhe o número correto.
 */
export class MathQuestionManager {
  /**
   * @param {number} maxSum - Resultado máximo da soma (ex.: 5, 10, 20)
   * @param {number} optionsCount - Quantidade de balões (uma certa, restantes erradas)
   */
  generateQuestion(maxSum, optionsCount) {
    const correct = Math.floor(Math.random() * (maxSum + 1));
    const a = correct === 0 ? 0 : Math.floor(Math.random() * (correct + 1));
    const b = correct - a;

    const correctStr = String(correct);

    const used = new Set([correct]);
    const distractors = [];

    for (let i = 1; distractors.length < optionsCount - 1; i++) {
      for (const delta of [i, -i]) {
        if (distractors.length >= optionsCount - 1) break;
        const wrong = correct + delta;
        if (wrong >= 0 && wrong <= maxSum * 2 && !used.has(wrong)) {
          used.add(wrong);
          distractors.push(String(wrong));
        }
      }
    }

    while (distractors.length < optionsCount - 1) {
      const wrong = Math.floor(Math.random() * (maxSum * 2 + 1));
      const wrongStr = String(wrong);
      if (!used.has(wrong)) {
        used.add(wrong);
        distractors.push(wrongStr);
      }
    }

    const options = shuffleArray([correctStr, ...distractors.slice(0, optionsCount - 1)]);

    return {
      correctAnswer: correctStr,
      options,
      prompt: `${a} + ${b} = ?`
    };
  }
}
