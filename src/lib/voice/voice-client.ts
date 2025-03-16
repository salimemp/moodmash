export interface VoiceRecordingOptions {
  maxDuration?: number;  // in seconds
  language?: string;
  onStart?: () => void;
  onStop?: (blob: Blob) => void;
  onDataAvailable?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export interface VoiceAnalysisResult {
  text: string;
  sentiment: {
    label: string;
    score: number;
  };
  emotions: {
    [key: string]: number;
  };
  confidence: number;
}

export class VoiceClient {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private isRecording = false;

  constructor(private options: VoiceRecordingOptions = {}) {
    this.options = {
      maxDuration: 300, // 5 minutes
      language: 'en',
      ...options
    };
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.options.onDataAvailable?.(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        this.options.onStart?.();

        // Set up max duration timer
        if (this.options.maxDuration) {
          setTimeout(() => {
            if (this.isRecording) {
              this.stopRecording();
            }
          }, this.options.maxDuration * 1000);
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.options.onStop?.(blob);
        this.cleanup();
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error('Recording error: ' + event.error);
        this.options.onError?.(error);
        this.cleanup();
        throw error;
      };

      this.mediaRecorder.start();
    } catch (error) {
      this.options.onError?.(error as Error);
      this.cleanup();
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('Not recording');
    }

    this.mediaRecorder.stop();
  }

  async processVoice(audioBlob: Blob): Promise<VoiceAnalysisResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('language', this.options.language || 'en');

    try {
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process voice recording');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Voice processing error: ' + (error as Error).message);
    }
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.isRecording = false;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
} 