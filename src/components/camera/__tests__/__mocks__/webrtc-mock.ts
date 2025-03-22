/**
 * WebRTC Mock Implementation
 * 
 * This file provides mock implementations of the WebRTC APIs used in the CameraCapture component.
 * This includes getUserMedia, MediaStream, and MediaStreamTrack.
 */

import { vi } from 'vitest';

// Mock MediaStreamTrack
export class MockMediaStreamTrack implements MediaStreamTrack {
  kind: string;
  enabled: boolean = true;
  muted: boolean = false;
  readyState: MediaStreamTrackState = 'live';
  label: string;
  id: string;
  contentHint: string = '';
  isolated: boolean = false;
  onended: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  onmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  onunmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  onisolationchange: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
  
  constructor(kind: string) {
    this.kind = kind;
    this.label = `Mock ${kind} track`;
    this.id = `mock-track-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  applyConstraints(): Promise<void> {
    return Promise.resolve();
  }

  clone(): MediaStreamTrack {
    return new MockMediaStreamTrack(this.kind);
  }

  getCapabilities(): MediaTrackCapabilities {
    return {};
  }

  getConstraints(): MediaTrackConstraints {
    return {};
  }

  getSettings(): MediaTrackSettings {
    return { deviceId: this.id };
  }
  
  stop() {
    this.readyState = 'ended';
  }
  
  addEventListener(_type: string, _listener: EventListenerOrEventListenerObject) {}
  removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject) {}
  dispatchEvent(_event: Event): boolean { return true; }
}

// Mock MediaStream
export class MockMediaStream implements MediaStream {
  id: string;
  active: boolean = true;
  tracks: MockMediaStreamTrack[] = [];
  onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;
  onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;
  
  constructor(tracks: MockMediaStreamTrack[] = []) {
    this.id = `mock-stream-${Math.random().toString(36).substring(2, 9)}`;
    
    if (tracks.length === 0) {
      this.tracks.push(new MockMediaStreamTrack('video'));
      this.tracks.push(new MockMediaStreamTrack('audio'));
    } else {
      this.tracks = tracks;
    }
  }
  
  getVideoTracks(): MediaStreamTrack[] {
    return this.tracks.filter(track => track.kind === 'video');
  }
  
  getAudioTracks(): MediaStreamTrack[] {
    return this.tracks.filter(track => track.kind === 'audio');
  }
  
  getTracks(): MediaStreamTrack[] {
    return this.tracks;
  }
  
  getTrackById(trackId: string): MediaStreamTrack | null {
    return this.tracks.find(track => track.id === trackId) || null;
  }
  
  addTrack(track: MediaStreamTrack): void {
    this.tracks.push(track as MockMediaStreamTrack);
  }
  
  removeTrack(track: MediaStreamTrack): void {
    const index = this.tracks.indexOf(track as MockMediaStreamTrack);
    if (index !== -1) {
      this.tracks.splice(index, 1);
    }
  }
  
  clone(): MediaStream {
    return new MockMediaStream([...this.tracks]);
  }
  
  addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void {}
  removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void {}
  dispatchEvent(_event: Event): boolean { return true; }
}

// Mock getUserMedia
export function mockGetUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream> {
  return new Promise<MediaStream>((resolve, reject) => {
    if (!constraints) {
      reject(new Error('No constraints provided'));
      return;
    }
    
    if (!constraints.video && !constraints.audio) {
      reject(new Error('No media requested'));
      return;
    }
    
    // Simulate a delay to mimic real API behavior
    setTimeout(() => {
      const tracks: MockMediaStreamTrack[] = [];
      
      if (constraints.video) {
        tracks.push(new MockMediaStreamTrack('video'));
      }
      
      if (constraints.audio) {
        tracks.push(new MockMediaStreamTrack('audio'));
      }
      
      resolve(new MockMediaStream(tracks));
    }, 50); // Using a smaller delay for tests
  });
}

// Setup mock for testing
export function setupWebRTCMock() {
  // Check if mediaDevices exists, otherwise create it
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {},
      writable: true,
      configurable: true,
    });
  }
  
  // Save the original getUserMedia if it exists
  const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
  
  // Replace with mock implementation
  navigator.mediaDevices.getUserMedia = vi.fn().mockImplementation(
    mockGetUserMedia
  ) as unknown as typeof navigator.mediaDevices.getUserMedia;
  
  // Return function to restore original implementation
  return () => {
    if (originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    }
  };
}

export default setupWebRTCMock; 