/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API synthesizer for short-form reel music playback
class ReelMusicSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timer: number | null = null;
  private currentGenre: string = 'synth';

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTrack(genre: 'synth' | 'ambient' | 'techno' | 'lofi' | 'hiphop' = 'synth') {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentGenre = genre;

    // Pattern sequencer
    let step = 0;
    const bpm = genre === 'techno' ? 128 : genre === 'synth' ? 116 : genre === 'ambient' ? 80 : 90;
    const intervalMs = (60 / bpm / 2) * 1000;

    // Chords and notes for different vibes (Black/Purple aesthetic)
    const synthNotes = [220, 261.63, 329.63, 392, 440, 523.25]; // A minor
    const technoBass = [55, 55, 110, 55, 73.42, 55, 82.41, 110];
    const ambientChords = [174.61, 220, 261.63, 329.63];

    this.timer = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      if (this.currentGenre === 'synth') {
        // Melodic synth arpeggio + sub bass
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = step % 4 === 0 ? 'sawtooth' : 'triangle';
        const note = synthNotes[(step + Math.floor(step / 8)) % synthNotes.length];
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);

        // Kick on every 4 steps
        if (step % 4 === 0) {
          this.triggerKick(now);
        }
      } else if (this.currentGenre === 'techno') {
        // Driving techno 4-on-the-floor
        if (step % 2 === 0) {
          this.triggerKick(now);
        }
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(technoBass[step % technoBass.length], now);
        bassGain.gain.setValueAtTime(0.15, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.2);
      } else {
        // Ambient soft pads
        if (step % 8 === 0) {
          ambientChords.forEach(freq => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.2);
          });
        }
      }

      step++;
    }, intervalMs);
  }

  private triggerKick(time: number) {
    if (!this.ctx) return;
    const kickOsc = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    kickOsc.frequency.setValueAtTime(140, time);
    kickOsc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
    kickGain.gain.setValueAtTime(0.35, time);
    kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    kickOsc.connect(kickGain);
    kickGain.connect(this.ctx.destination);
    kickOsc.start(time);
    kickOsc.stop(time + 0.18);
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  toggle(genre: 'synth' | 'ambient' | 'techno' | 'lofi' | 'hiphop' = 'synth'): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.playTrack(genre);
      return true;
    }
  }

  getStatus() {
    return this.isPlaying;
  }
}

export const reelAudio = new ReelMusicSynthesizer();
