import { VoiceAnalysisResult, VoiceClient } from '@/lib/voice/voice-client';
import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { Button } from '../ui/button/button';

interface VoiceRecorderProps {
  onAnalysisComplete?: (result: VoiceAnalysisResult) => void;
  language?: string;
  maxDuration?: number;
  buttonText?: string;
  processingText?: string;
  recordingText?: string;
  className?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAnalysisComplete,
  language = 'en',
  maxDuration = 60,
  buttonText = 'Record Voice',
  processingText = 'Processing...',
  recordingText = 'Recording...',
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceClient, setVoiceClient] = useState<VoiceClient | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult | null>(null);

  // Initialize voice client
  useEffect(() => {
    const client = new VoiceClient({
      maxDuration,
      language,
      onStart: () => {
        setIsRecording(true);
        setRecordingTime(0);
        setError(null);
      },
      onStop: async (blob) => {
        setIsRecording(false);
        setIsProcessing(true);
        
        try {
          const result = await client.processVoice(blob);
          setAnalysisResult(result);
          if (onAnalysisComplete) {
            onAnalysisComplete(result);
          }
        } catch (err) {
          setError(`Error processing voice: ${(err as Error).message}`);
        } finally {
          setIsProcessing(false);
        }
      },
      onError: (err) => {
        setError(`Recording error: ${err.message}`);
        setIsRecording(false);
        setIsProcessing(false);
      },
    });
    
    setVoiceClient(client);
    
    return () => {
      // Clean up if recording is in progress
      if (client.isCurrentlyRecording()) {
        client.stopRecording().catch(console.error);
      }
    };
  }, [maxDuration, language, onAnalysisComplete]);

  // Timer for recording duration
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const toggleRecording = async () => {
    if (!voiceClient) return;
    
    try {
      if (isRecording) {
        await voiceClient.stopRecording();
      } else {
        setAnalysisResult(null);
        await voiceClient.startRecording();
      }
    } catch (err) {
      setError(`Error: ${(err as Error).message}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`voice-recorder ${className}`} data-testid="voice-recorder">
      <div className="voice-recorder-controls">
        <Button 
          onClick={toggleRecording}
          disabled={isProcessing}
          data-testid="voice-recorder-button"
          className={isRecording ? 'recording' : ''}
        >
          {isRecording ? 'Stop Recording' : buttonText}
        </Button>
        
        {isRecording && (
          <div className="recording-indicator" data-testid="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-text">{recordingText}</span>
            <span className="recording-time">{formatTime(recordingTime)}</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="processing-indicator" data-testid="processing-indicator">
            <LoadingSpinner size="sm" />
            <span className="processing-text">{processingText}</span>
          </div>
        )}
        
        {error && (
          <div className="error-message" data-testid="error-message">
            {error}
          </div>
        )}
      </div>
      
      {analysisResult && (
        <div className="analysis-result" data-testid="analysis-result">
          <h3>Analysis Result</h3>
          <div className="transcription">
            <strong>Transcription:</strong> {analysisResult.text}
          </div>
          <div className="sentiment">
            <strong>Sentiment:</strong> {analysisResult.sentiment.label} 
            ({Math.round(analysisResult.sentiment.score * 100)}%)
          </div>
          {Object.keys(analysisResult.emotions).length > 0 && (
            <div className="emotions">
              <strong>Emotions:</strong>
              <ul>
                {Object.entries(analysisResult.emotions)
                  .sort(([, a], [, b]) => b - a)
                  .map(([emotion, score]) => (
                    <li key={emotion}>
                      {emotion}: {Math.round(score * 100)}%
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <div className="confidence">
            <strong>Confidence:</strong> {Math.round(analysisResult.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder; 