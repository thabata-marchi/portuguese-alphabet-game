/**
 * Voice Recognition module using TensorFlow.js Speech Commands
 *
 * Allows the child to speak the letter instead of clicking.
 * Uses the pre-trained Speech Commands model from TensorFlow.js
 * which recognizes short voice commands in the browser.
 */

export class SpeechRecognizer {
  constructor() {
    this.recognizer = null;
    this.isListening = false;
    this.onResult = null; // callback: (letter, confidence) => {}
    this.useWebSpeechAPI = false; // fallback for Web Speech API
  }

  async init() {
    // Em produção o microfone exige HTTPS (contexto seguro)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      console.warn('Voice: requires HTTPS (secure context)');
      return false;
    }
    // Preferir Web Speech API: reconhece letras em pt-BR ("A", "B", "C").
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      if (this._initWebSpeechAPI()) {
        console.log('Voice: Web Speech API (pt-BR)');
        return true;
      }
    }
    try {
      await import('@tensorflow/tfjs');
      const speechCommands = await import('@tensorflow-models/speech-commands');
      this.recognizer = speechCommands.create('BROWSER_FFT');
      await this.recognizer.ensureModelLoaded();
      console.log('Voice: TF.js Speech Commands (palavras em inglês)');
      return true;
    } catch (e) {
      console.warn('Voice recognition not available:', e.message);
      return false;
    }
  }

  _initWebSpeechAPI() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      this.useWebSpeechAPI = true;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.webRecognizer = new SpeechRecognition();
      this.webRecognizer.lang = 'pt-BR';
      this.webRecognizer.continuous = true;
      this.webRecognizer.interimResults = false;
      this.webRecognizer.maxAlternatives = 3;

      this.webRecognizer.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        if (last.isFinal) {
          for (let i = 0; i < last.length; i++) {
            const transcript = last[i].transcript.trim().toUpperCase();
            const confidence = last[i].confidence;
            const letter = this._extractLetter(transcript);
            if (letter && this.onResult) {
              this.onResult(letter, confidence);
              return;
            }
          }
        }
      };

      this.webRecognizer.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.warn('Voice recognition error:', event.error);
        }
      };

      this.webRecognizer.onend = () => {
        // Navegador parou (ex.: silêncio). Reinicia se ainda queremos ouvir.
        if (this.isListening) {
          try {
            this.webRecognizer.start();
          } catch (e) {
            this.isListening = false; // falhou; próxima rodada fará stop+start
          }
        }
      };

      console.log('Web Speech API initialized');
      return true;
    }

    console.warn('No voice recognition API available');
    return false;
  }

  _extractLetter(transcript) {
    if (!transcript || typeof transcript !== 'string') return null;
    const normalized = transcript
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    const cleaned = normalized.replace(/[^A-Z]/g, '');

    if (cleaned.length === 0) return null;
    if (cleaned.length === 1) return cleaned;
    if (cleaned.length === 2) return cleaned;
    // "LETRA A" vira "LETRAA" -> pega a última letra (o usuário disse "letra A")
    if (cleaned.length > 2) return cleaned.charAt(cleaned.length - 1);
    return null;
  }

  async start() {
    if (this.isListening) return;
    this.isListening = true;

    if (this.useWebSpeechAPI) {
      try {
        this.webRecognizer.start();
      } catch (e) {
        console.warn('Error starting recognition:', e.message);
      }
      return;
    }

    // TensorFlow.js Speech Commands
    if (this.recognizer) {
      this.recognizer.listen(result => {
        const scores = result.scores;
        const labels = this.recognizer.wordLabels();

        // Find the prediction with highest score
        let maxScore = 0;
        let maxIndex = 0;
        scores.forEach((score, i) => {
          if (score > maxScore) {
            maxScore = score;
            maxIndex = i;
          }
        });

        const word = labels[maxIndex];
        const confidence = maxScore;

        // Filter low-confidence predictions and control words
        if (confidence > 0.7 && word !== '_background_noise_' && word !== '_unknown_') {
          const letter = this._mapWordToLetter(word);
          if (letter && this.onResult) {
            this.onResult(letter, confidence);
          }
        }
      }, {
        probabilityThreshold: 0.7,
        overlapFactor: 0.5,
        invokeCallbackOnNoiseAndUnknown: false
      });
    }
  }

  stop() {
    this.isListening = false;

    if (this.useWebSpeechAPI && this.webRecognizer) {
      try {
        this.webRecognizer.stop();
      } catch (e) {
        // Ignore
      }
      return;
    }

    if (this.recognizer && this.recognizer.isListening()) {
      this.recognizer.stopListening();
    }
  }

  /**
   * Maps Speech Commands model words to letters
   * The model recognizes ~20 commands like "yes", "no", "up", "down", etc.
   * We map to letters when possible
   */
  _mapWordToLetter(word) {
    const mapping = {
      // Model commands that start with letters
      'zero': '0',
      'one': '1',
      'two': '2',
      'three': '3',
      'four': '4',
      'five': '5',
      'six': '6',
      'seven': '7',
      'eight': '8',
      'nine': '9',
      'yes': 'S',
      'no': 'N',
      'go': 'G',
      'up': 'U',
      'down': 'D',
      'left': 'L',
      'right': 'R',
      'stop': 'S',
    };

    return mapping[word.toLowerCase()] || word.toUpperCase().charAt(0);
  }

  destroy() {
    this.stop();
    this.recognizer = null;
    this.webRecognizer = null;
  }
}
