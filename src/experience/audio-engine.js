const AUDIO_STUB = {
  switchScene() {},
  pulse() {},
  celebrate() {},
  unlock() {},
  setVolume() {},
  getVolume: () => 0,
  toggleMute() {},
  triggerThunder() {}
};

export function mountAudioEngine() {
  const AudioContext = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AudioContext) {
    return AUDIO_STUB;
  }

  const ac = new AudioContext();
  const masterGain = ac.createGain();
  masterGain.gain.value = 0.6;
  masterGain.connect(ac.destination);

  let activeScene = null;
  let volume = 0.6;
  let previousVolume = volume;
  const activeIntervals = new Set();

  const clearIntervals = () => {
    activeIntervals.forEach((id) => clearInterval(id));
    activeIntervals.clear();
  };

  function createNoiseBuffer(type = 'white') {
    const bufferSize = ac.sampleRate * 4;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
    } else {
      let b0 = 0; let b1 = 0; let b2 = 0; let b3 = 0; let b4 = 0; let b5 = 0; let b6 = 0;
      for (let i = 0; i < bufferSize; i += 1) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] *= 0.11;
      }
    }
    return buffer;
  }

  function playTone(freq, duration, volumeScale = 0.08) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const now = ac.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volumeScale, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.2);
  }

  function triggerThunder(intensity = 1) {
    const noiseSource = ac.createBufferSource();
    noiseSource.buffer = createNoiseBuffer('pink');
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    const now = ac.currentTime;
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 2.2);
    const thunderGain = ac.createGain();
    thunderGain.gain.setValueAtTime(0, now);
    thunderGain.gain.linearRampToValueAtTime(0.9 * intensity, now + 0.1);
    thunderGain.gain.exponentialRampToValueAtTime(0.001, now + 5);
    noiseSource.connect(filter).connect(thunderGain).connect(masterGain);
    noiseSource.start();
    noiseSource.stop(now + 6);
    if (typeof window !== 'undefined' && typeof window.__triggerRainLightning === 'function') {
      window.__triggerRainLightning();
    }
  }

  function scheduleInterval(handler, interval) {
    const id = setInterval(handler, interval);
    activeIntervals.add(id);
    return () => {
      clearInterval(id);
      activeIntervals.delete(id);
    };
  }

  function stopScene() {
    if (activeScene) {
      activeScene.stop?.();
      activeScene = null;
    }
    clearIntervals();
  }

  function createRainScene() {
    stopScene();
    const rainGain = ac.createGain();
    rainGain.gain.value = 1;
    rainGain.connect(masterGain);

    const rainSource = ac.createBufferSource();
    rainSource.buffer = createNoiseBuffer('white');
    rainSource.loop = true;
    const rainFilter = ac.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 2200;
    const rainLevel = ac.createGain();
    rainLevel.gain.value = 0.32;
    rainSource.connect(rainFilter).connect(rainLevel).connect(rainGain);
    rainSource.start();

    const sparkleSource = ac.createBufferSource();
    sparkleSource.buffer = createNoiseBuffer('white');
    sparkleSource.loop = true;
    const sparkleFilter = ac.createBiquadFilter();
    sparkleFilter.type = 'highpass';
    sparkleFilter.frequency.value = 3500;
    const sparkleGain = ac.createGain();
    sparkleGain.gain.value = 0.08;
    sparkleSource.connect(sparkleFilter).connect(sparkleGain).connect(rainGain);
    sparkleSource.start();

    const padOsc = ac.createOscillator();
    padOsc.type = 'sine';
    padOsc.frequency.value = 55;
    const padGain = ac.createGain();
    padGain.gain.value = 0.02;
    padOsc.connect(padGain).connect(rainGain);
    padOsc.start();

    const dropletLoop = scheduleInterval(() => {
      const notes = [174.61, 196, 207.65, 233.08, 261.63];
      const note = notes[Math.floor(Math.random() * notes.length)];
      playTone(note, 2.4, 0.07);
      if (Math.random() > 0.6) {
        playTone(note / 2, 3, 0.05);
      }
    }, 4200);

    const thunderLoop = scheduleInterval(() => {
      if (Math.random() > 0.3) return;
      triggerThunder(0.7 + Math.random() * 0.4);
    }, 9000);

    activeScene = {
      stop: () => {
        rainSource.stop();
        sparkleSource.stop();
        padOsc.stop();
        dropletLoop();
        thunderLoop();
      }
    };
  }

  function ensureScene() {
    if (!activeScene) {
      createRainScene();
    }
  }

  function switchScene() {
    ensureScene();
  }

  function setVolume(value) {
    const clamped = Math.max(0, Math.min(1, value));
    volume = clamped;
    masterGain.gain.setTargetAtTime(clamped, ac.currentTime, 0.1);
  }

  function toggleMute() {
    if (volume <= 0.01) {
      setVolume(previousVolume || 0.6);
    } else {
      previousVolume = volume;
      setVolume(0);
    }
  }

  async function unlock() {
    try {
      await ac.resume();
    } catch (_) {
      // ignore resume failure
    }
    ensureScene();
  }

  return {
    switchScene,
    pulse: () => {},
    celebrate: () => {},
    unlock,
    setVolume,
    getVolume: () => volume,
    toggleMute,
    triggerThunder
  };
}
