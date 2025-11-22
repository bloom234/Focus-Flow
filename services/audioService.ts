
import { NoiseType } from '../types';

class AudioService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;

  // Initialize the audio context lazily (user gesture required)
  public initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
    return this.audioContext;
  }

  // Allow external nodes (like a recorder destination) to connect to the output
  public connectTo(destinationNode: AudioNode) {
    if (this.gainNode) {
      this.gainNode.connect(destinationNode);
    }
  }

  public disconnectFrom(destinationNode: AudioNode) {
     if (this.gainNode) {
         try {
            this.gainNode.disconnect(destinationNode);
         } catch (e) {
             // Ignore if not connected
         }
     }
  }

  // Generate noise buffer based on type
  private createNoiseBuffer(type: NoiseType): AudioBuffer {
    if (!this.audioContext) throw new Error("AudioContext not initialized");

    const bufferSize = 5 * this.audioContext.sampleRate; // 5 seconds loop
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      switch (type) {
        case NoiseType.White:
          data[i] = white;
          break;
        case NoiseType.Pink:
          // Approximation of pink noise (1/f)
          const b0 = 0.99886 * (lastOut || 0) + white * 0.0555179;
          const b1 = 0.99332 * (lastOut || 0) + white * 0.0750759;
          const b2 = 0.96900 * (lastOut || 0) + white * 0.1538520;
          const b3 = 0.86650 * (lastOut || 0) + white * 0.3104856;
          const b4 = 0.55000 * (lastOut || 0) + white * 0.5329522;
          const b5 = -0.7616 * (lastOut || 0) - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + white * 0.5362) * 0.11;
          lastOut = data[i]; 
          break;
        case NoiseType.Brown:
           // Brownian noise (1/f^2)
           const brown = (lastOut + (0.02 * white)) / 1.02;
           lastOut = brown;
           data[i] = brown * 3.5;
           break;
        case NoiseType.Green:
           // Simple ambient approximation
           const green = (lastOut + (0.05 * white)) / 1.05;
           lastOut = green;
           data[i] = green * 2.0; 
           break;
      }
    }
    return buffer;
  }

  public async play(type: NoiseType, volume: number) {
    this.initContext();
    if (!this.audioContext || !this.gainNode) return;

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Stop existing sound smoothly
    if (this.isPlaying) {
      this.stop();
    }

    const buffer = this.createNoiseBuffer(type);
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.loop = true;
    this.sourceNode.connect(this.gainNode);
    
    // Smooth fade in
    this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.5);

    this.sourceNode.start();
    this.isPlaying = true;
  }

  public stop() {
    if (!this.sourceNode || !this.audioContext || !this.gainNode) return;

    // Smooth fade out
    const stopTime = this.audioContext.currentTime + 0.5;
    this.gainNode.gain.linearRampToValueAtTime(0, stopTime);
    this.sourceNode.stop(stopTime);
    
    // Cleanup after fade
    const oldSource = this.sourceNode;
    setTimeout(() => {
      try { oldSource.disconnect(); } catch(e) {}
    }, 600);

    this.isPlaying = false;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.audioContext) {
       this.gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    }
  }
  
  public getIsPlaying() {
      return this.isPlaying;
  }
}

export const audioService = new AudioService();
