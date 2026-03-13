/**
 * Web Worker para inferência de voz com TensorFlow.js
 *
 * Processa áudio em background sem bloquear a UI principal.
 * Carrega o modelo Speech Commands e roda inferência nos frames de áudio.
 */

let recognizer = null;
let isReady = false;

self.onmessage = async function(event) {
  const { type, data } = event.data;

  switch (type) {
    case 'init':
      try {
        const tf = await import('@tensorflow/tfjs');
        const speechCommands = await import('@tensorflow-models/speech-commands');

        recognizer = speechCommands.create('BROWSER_FFT');
        await recognizer.ensureModelLoaded();

        isReady = true;
        self.postMessage({
          type: 'ready',
          data: {
            labels: recognizer.wordLabels()
          }
        });
      } catch (e) {
        self.postMessage({
          type: 'error',
          data: { message: 'Modelo de voz não pôde ser carregado: ' + e.message }
        });
      }
      break;

    case 'predict':
      if (!isReady || !recognizer) {
        self.postMessage({
          type: 'error',
          data: { message: 'Modelo não está pronto' }
        });
        return;
      }

      try {
        const result = await recognizer.recognize(data.audioData);
        const scores = result.scores;
        const labels = recognizer.wordLabels();

        let maxScore = 0;
        let maxIndex = 0;
        scores.forEach((score, i) => {
          if (score > maxScore) {
            maxScore = score;
            maxIndex = i;
          }
        });

        self.postMessage({
          type: 'prediction',
          data: {
            word: labels[maxIndex],
            confidence: maxScore,
            allScores: Object.fromEntries(
              labels.map((label, i) => [label, scores[i]])
            )
          }
        });
      } catch (e) {
        self.postMessage({
          type: 'error',
          data: { message: 'Erro na predição: ' + e.message }
        });
      }
      break;

    case 'get_labels':
      if (recognizer) {
        self.postMessage({
          type: 'labels',
          data: { labels: recognizer.wordLabels() }
        });
      }
      break;
  }
};
