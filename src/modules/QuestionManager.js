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

  /**
   * Gera pergunta no estilo "Como escreve BOLA?" — palavra visível (forca), selecionar sílabas na ordem.
   * Usado quando currentContentKey === 'como_escreve'.
   * @param {number} optionsCount - Quantidade de opções de sílabas (inclui as corretas + distratores)
   * @returns {{ word: string, syllables: string[], options: string[], prompt: string } | null}
   */
  generateSyllableQuestion(optionsCount) {
    const levelContent = this.content[this.currentContentKey];
    const wordsData = levelContent?.wordsWithSyllables;
    if (!wordsData?.length) return null;

    const items = levelContent.items || [];
    const usedItems = this.usedItems;
    const available = wordsData.filter((w) => !usedItems.includes(w.word));
    const pool = available.length > 0 ? available : wordsData;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    usedItems.push(chosen.word);
    if (usedItems.length >= wordsData.length) usedItems.length = 0;

    const silabasLevel = this.content.silabas_simples;
    const allSyllables = (silabasLevel?.items) || [];
    const distractors = allSyllables.filter((s) => !chosen.syllables.includes(s));
    const shuffledDistractors = shuffleArray(distractors);
    const need = Math.max(0, optionsCount - chosen.syllables.length);
    const selectedDistractors = shuffledDistractors.slice(0, need);
    const options = shuffleArray([...chosen.syllables, ...selectedDistractors]);

    const prompt = `Como escreve ${chosen.word}? Selecione as sílabas na ordem.`;

    return {
      word: chosen.word,
      syllables: chosen.syllables,
      options,
      prompt
    };
  }

  /**
   * Gera pergunta "Encontre as sílabas que formam a palavra X" — ordem livre, palavra com hífens (ex: BO-LA).
   * Usado quando currentContentKey === 'encontre_silabas'.
   */
  generateEncontreSilabasQuestion(optionsCount) {
    const levelContent = this.content[this.currentContentKey];
    const wordsData = levelContent?.wordsWithSyllables;
    if (!wordsData?.length) return null;

    const usedItems = this.usedItems;
    const available = wordsData.filter((w) => !usedItems.includes(w.word));
    const pool = available.length > 0 ? available : wordsData;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    usedItems.push(chosen.word);
    if (usedItems.length >= wordsData.length) usedItems.length = 0;

    const silabasLevel = this.content.silabas_simples;
    const baseSyllables = (silabasLevel?.items) || [];
    const allSyllables = [...baseSyllables, 'A', 'E', 'I', 'O', 'U'];
    const distractors = allSyllables.filter((s) => !chosen.syllables.includes(s));
    const shuffledDistractors = shuffleArray(distractors);
    const need = Math.max(0, optionsCount - chosen.syllables.length);
    const selectedDistractors = shuffledDistractors.slice(0, need);
    const options = shuffleArray([...chosen.syllables, ...selectedDistractors]);

    const wordWithHyphens = chosen.syllables.join('-');
    const prompt = `Encontre as sílabas que formam a palavra ${chosen.word}`;

    return {
      word: chosen.word,
      syllables: chosen.syllables,
      wordWithHyphens,
      options,
      prompt
    };
  }

  isSyllableGame() {
    return this.currentContentKey === 'como_escreve';
  }

  isEncontreSilabasGame() {
    return this.currentContentKey === 'encontre_silabas';
  }

  getContentTitle() {
    const levelContent = this.content[this.currentContentKey];
    return levelContent ? levelContent.title : '';
  }
}
