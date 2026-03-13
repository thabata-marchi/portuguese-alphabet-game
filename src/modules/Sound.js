export class Sound {
  constructor() {
    this.muted = false;
    this.voice = null;
    this._unlocked = false;
    this.audioContext = null; // criado no primeiro clique (exigência Safari/iOS)
    this._initSoundEffects();
    this._loadVoice();
  }

  /**
   * Desbloqueia áudio no primeiro clique (exigência dos navegadores).
   * Em Safari/iOS o AudioContext precisa ser CRIADO no gesto, não só resumed.
   * @returns {Promise<void>}
   */
  async unlock() {
    if (this._unlocked) return;
    this._unlocked = true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!this.audioContext) {
      this.audioContext = new Ctx();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(() => {});
    }
  }

  _initSoundEffects() {

    this.soundEffects = {
      correct:  { frequencies: [523, 659, 784],  duration: 0.15, type: 'sine' },
      wrong:    { frequencies: [200, 180],        duration: 0.2,  type: 'sawtooth' },
      click:    { frequencies: [800],             duration: 0.05, type: 'square' },
      levelUp:  { frequencies: [523, 659, 784, 1047], duration: 0.2, type: 'sine' },
      star:     { frequencies: [1047, 1319],      duration: 0.1,  type: 'sine' },
      pop:      { frequencies: [600, 400],        duration: 0.08, type: 'sine' },
      whoosh:   { noise: true, duration: 0.15 }
    };
  }

  _loadVoice() {
    const selectVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Priority: Google pt-BR (neural) > any pt-BR > null (default)
      this.voice = voices.find(v => v.name === 'Google português do Brasil')
        || voices.find(v => v.lang === 'pt-BR')
        || null;
    };

    selectVoice();
    // Voices may load asynchronously (Chrome)
    window.speechSynthesis.onvoiceschanged = selectVoice;
  }

  registerSound(name, config) {
    this.soundEffects[name] = config;
  }

  play(name) {
    if (this.muted) return;
    if (!this.audioContext) return; // só toca depois de unlock() no clique

    const effect = this.soundEffects[name];
    if (!effect) return;

    if (effect.noise) {
      this._playNoise(effect.duration);
    } else {
      this._playTone(effect.frequencies, effect.duration, effect.type);
    }
  }

  _playTone(frequencies, duration, type) {
    const ctx = this.audioContext;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration * frequencies.length);

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * duration);
      osc.connect(gainNode);
      osc.start(ctx.currentTime + i * duration);
      osc.stop(ctx.currentTime + (i + 1) * duration);
    });
  }

  _playNoise(duration) {
    const ctx = this.audioContext;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  speakText(text) {
    if (this.muted) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    if (this.voice) utterance.voice = this.voice;
    window.speechSynthesis.speak(utterance);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}
