import MoodAR from '@/components/ar/MoodAR';
import CameraCapture, { type FaceEmotion } from '@/components/camera/CameraCapture';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button/button';
import { type Emotion } from '@/lib/ml/sentiment-analyzer';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function CameraMoodPage() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string | undefined>();
  const [detectedEmotions, setDetectedEmotions] = useState<Emotion[]>([]);
  const [step, setStep] = useState<'capture' | 'ar' | 'save'>('capture');
  
  // Handle emotion detection from camera
  const handleEmotionDetected = (emotions: FaceEmotion[]) => {
    // Map the FaceEmotion type to the Emotion type used in the app
    const mappedEmotions: Emotion[] = emotions.map(e => ({
      type: e.emotion as any, // Type casting as the exact string literals might differ
      score: e.score
    }));
    
    setDetectedEmotions(mappedEmotions);
  };
  
  // Handle image capture from camera
  const handleImageCaptured = (imageData: string) => {
    setCapturedImage(imageData);
    setStep('ar');
  };
  
  // Save mood and redirect to dashboard
  const handleSaveMood = async () => {
    // Here you would typically send the data to your API
    console.log('Saving mood:', {
      capturedImage,
      emotions: detectedEmotions
    });
    
    // For demo purposes, just show a success message
    alert('Mood saved successfully!');
    
    // Redirect to dashboard
    router.push('/dashboard');
  };
  
  // Reset the process
  const handleReset = () => {
    setCapturedImage(undefined);
    setDetectedEmotions([]);
    setStep('capture');
  };
  
  return (
    <>
      <Head>
        <title>Camera Mood - MoodMash</title>
        <meta
          name="description"
          content="Create moods using your camera and see them in AR"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MainLayout>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Camera Mood Creator</h1>
          </div>
          
          <p className="text-muted-foreground">
            Express yourself with our camera-based mood creation tool that analyzes your facial expressions and creates a 3D AR visualization.
          </p>
          
          {step === 'capture' && (
            <div className="w-full max-w-2xl mx-auto bg-card rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Step 1: Capture Your Mood</h2>
              <p className="mb-4 text-muted-foreground">
                Allow camera access and position your face in the frame. Then click "Capture Mood" to analyze your facial expression.
              </p>
              <CameraCapture 
                onEmotionDetected={handleEmotionDetected}
                onImageCaptured={handleImageCaptured}
              />
            </div>
          )}
          
          {step === 'ar' && capturedImage && (
            <div className="w-full max-w-2xl mx-auto bg-card rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Step 2: Your Mood in AR</h2>
              <p className="mb-4 text-muted-foreground">
                Here's how your mood looks in augmented reality! The 3D shapes and colors represent your emotional state.
              </p>
              
              <MoodAR 
                emotions={detectedEmotions} 
                capturedImage={capturedImage}
                width={600}
                height={400}
              />
              
              <div className="flex gap-4 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleReset}
                >
                  Try Again
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => setStep('save')}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
          
          {step === 'save' && (
            <div className="w-full max-w-2xl mx-auto bg-card rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Step 3: Save Your Mood</h2>
              <p className="mb-4 text-muted-foreground">
                Your mood analysis is complete! You can now save this mood to your profile.
              </p>
              
              <div className="rounded-lg overflow-hidden mb-4">
                {capturedImage && (
                  <img 
                    src={capturedImage} 
                    alt="Captured mood" 
                    className="w-full h-auto"
                  />
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium mb-2">Detected Emotions:</h3>
                <div className="flex flex-wrap gap-2">
                  {detectedEmotions.map((emotion, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 rounded-full text-sm bg-primary/10"
                    >
                      {emotion.type} ({Math.round(emotion.score * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleReset}
                >
                  Start Over
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={handleSaveMood}
                >
                  Save Mood
                </Button>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </>
  );
} 