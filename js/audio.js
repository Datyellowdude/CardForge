// Sistema de Áudio Procedural com Web Audio API
// Efeitos sonoros (SFX) e Trilha Sonora Dinâmica para HDD RPG

class SoundManager {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.35;
        this.currentTrack = null;
        this.musicAudio = null;
        this.bgmTimer = null;
        this.noteIndex = 0;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.initialized = true;
            }
        } catch (e) {
            console.warn('Web Audio API não suportada ou bloqueada:', e);
        }
    }

    ensureContext() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        } else {
            this.playMusic(this.currentTrack || 'vila');
        }
        return this.musicEnabled;
    }

    // Gerador de tom simples com envelope ADSR
    playTone(freq, type = 'sine', duration = 0.2, gainPeak = 0.3, pitchSlide = null) {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            if (pitchSlide) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, pitchSlide), now + duration);
            }

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(gainPeak * this.masterVolume, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {}
    }

    // Gerador de ruído branco para ataques e explosões
    playNoise(duration = 0.2, gainPeak = 0.2, filterFreq = 1000) {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + duration);

            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(gainPeak * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
            noise.stop(now + duration);
        } catch (e) {}
    }

    // SFX ESPECÍFICOS DO JOGO
    step() {
        this.playTone(120 + Math.random() * 30, 'triangle', 0.06, 0.05, 80);
    }

    cardSelect() {
        this.playTone(440, 'sine', 0.08, 0.12, 580);
    }

    cardPlace() {
        this.playTone(320, 'triangle', 0.12, 0.15, 220);
    }

    cardActivate() {
        this.playTone(523.25, 'sine', 0.15, 0.2, 784);
    }

    slash() {
        this.playNoise(0.18, 0.28, 2500);
        this.playTone(280, 'sawtooth', 0.14, 0.18, 70);
    }

    heavySlash() {
        this.playNoise(0.25, 0.35, 1800);
        this.playTone(180, 'sawtooth', 0.2, 0.25, 40);
    }

    fireball() {
        this.playNoise(0.3, 0.3, 1400);
        this.playTone(400, 'sawtooth', 0.25, 0.2, 120);
    }

    lightning() {
        this.playNoise(0.35, 0.35, 3800);
        this.playTone(880, 'sawtooth', 0.2, 0.25, 110);
    }

    ice() {
        this.playTone(900, 'sine', 0.2, 0.2, 400);
        this.playTone(1200, 'triangle', 0.18, 0.15, 600);
    }

    shield() {
        this.playTone(220, 'square', 0.18, 0.22, 160);
        this.playNoise(0.1, 0.15, 800);
    }

    sharpen() {
        this.playTone(1046.5, 'sine', 0.25, 0.2, 1318.5);
    }

    heal() {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.2, 0.15);
            }, idx * 60);
        });
    }

    coin() {
        this.playTone(987.77, 'sine', 0.1, 0.2);
        setTimeout(() => {
            this.playTone(1318.5, 'sine', 0.18, 0.25);
        }, 80);
    }

    anvil() {
        this.playTone(1200, 'triangle', 0.22, 0.3, 800);
        this.playTone(600, 'square', 0.15, 0.15);
    }

    hurt() {
        this.playTone(150, 'sawtooth', 0.18, 0.25, 60);
        this.playNoise(0.15, 0.2, 1000);
    }

    defeat() {
        const notes = [300, 270, 240, 180];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sawtooth', 0.3, 0.22);
            }, idx * 160);
        });
    }

    victory() {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.25, 0.25);
            }, idx * 100);
        });
    }

    transition() {
        this.playTone(330, 'sine', 0.25, 0.15, 550);
    }

    // SINTETIZADOR DE MÚSICA DE FUNDO DINÂMICA
    playMusic(trackName) {
        if (this.currentTrack === trackName && (this.bgmTimer || (this.musicAudio && !this.musicAudio.paused))) return;
        this.stopMusic();
        this.currentTrack = trackName;
        if (!this.musicEnabled) return;

        const musicFiles = {
            menu: 'assets/music/menu.ogg',
            vila: 'assets/music/vila.wav',
            planicie: 'assets/music/planicie.mp3',
            caverna: 'assets/music/caverna.mp3',
            floresta: 'assets/music/floresta.ogg',
            castelo: 'assets/music/castelo.wav'
        };
        if (musicFiles[trackName]) {
            this.musicAudio = new Audio(musicFiles[trackName]);
            this.musicAudio.loop = true;
            this.musicAudio.volume = trackName === 'floresta' ? Math.min(1, this.masterVolume + 0.08) : this.masterVolume;
            this.musicAudio.play().catch(error => console.warn('Não foi possível iniciar a música:', error));
            return;
        }

        this.ensureContext();

        // Padrões musicais medievais sintetizados
        // Notas em Hz: Dó4 (261.6), Ré4 (293.7), Mi4 (329.6), Sol4 (392.0), Lá4 (440.0), Dó5 (523.3)
        const tracks = {
            vila: {
                tempo: 380, // ms por nota
                synth: 'triangle',
                bass: 'sine',
                notes: [
                    261.6, 329.6, 392.0, 329.6, 440.0, 392.0, 329.6, 293.7,
                    261.6, 329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6
                ],
                bassNotes: [130.8, 164.8, 174.6, 196.0]
            },
            planicie: {
                tempo: 300,
                synth: 'sine',
                bass: 'triangle',
                notes: [
                    329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6, 392.0,
                    440.0, 523.3, 587.3, 523.3, 440.0, 392.0, 329.6, 293.7
                ],
                bassNotes: [164.8, 196.0, 220.0, 196.0]
            },
            caverna: {
                tempo: 450,
                synth: 'sine',
                bass: 'sawtooth',
                notes: [
                    220.0, 246.9, 261.6, 220.0, 196.0, 220.0, 261.6, 329.6,
                    311.1, 293.7, 261.6, 220.0, 207.7, 220.0, 246.9, 220.0
                ],
                bassNotes: [110.0, 98.0, 87.3, 110.0]
            },
            combate: {
                tempo: 200,
                synth: 'sawtooth',
                bass: 'square',
                notes: [
                    220.0, 220.0, 261.6, 220.0, 293.7, 261.6, 329.6, 293.7,
                    392.0, 329.6, 293.7, 261.6, 220.0, 246.9, 220.0, 196.0
                ],
                bassNotes: [110.0, 110.0, 130.8, 146.8]
            }
        };

        const currentData = tracks[trackName] || tracks.vila;
        let step = 0;

        const loop = () => {
            if (!this.musicEnabled || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const note = currentData.notes[step % currentData.notes.length];
                const bass = currentData.bassNotes[Math.floor(step / 4) % currentData.bassNotes.length];

                // Melodia
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = currentData.synth;
                osc.frequency.setValueAtTime(note, now);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, now + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + (currentData.tempo / 1000) * 0.9);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + (currentData.tempo / 1000));

                // Baixo a cada 2 compassos
                if (step % 2 === 0) {
                    const bassOsc = this.ctx.createOscillator();
                    const bassGain = this.ctx.createGain();
                    bassOsc.type = currentData.bass;
                    bassOsc.frequency.setValueAtTime(bass, now);
                    bassGain.gain.setValueAtTime(0.001, now);
                    bassGain.gain.linearRampToValueAtTime(0.04 * this.masterVolume, now + 0.05);
                    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + (currentData.tempo / 1000) * 1.8);
                    bassOsc.connect(bassGain);
                    bassGain.connect(this.ctx.destination);
                    bassOsc.start(now);
                    bassOsc.stop(now + (currentData.tempo / 1000) * 1.9);
                }

                step++;
            } catch (e) {}

            this.bgmTimer = setTimeout(loop, currentData.tempo);
        };

        loop();
    }

    stopMusic() {
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio.currentTime = 0;
            this.musicAudio = null;
        }
    }
}

// Instância global de áudio
const audio = new SoundManager();
