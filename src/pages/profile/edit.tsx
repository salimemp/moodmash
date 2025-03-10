import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/card';
import { User, Upload, Loader2, Save, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@/lib/hooks/useFetch';

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
}

interface ProfileUpdateData {
  name: string;
  bio: string;
  image: string;
}

export default function EditProfile() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Use the enhanced mutation hook for profile updates
  const [updateProfile, { isLoading: isSaving, error: updateError, reset: resetUpdateError }] = 
    useMutation<{ success: boolean, user: ExtendedUser }, ProfileUpdateData>(
      '/api/profile/update',
      'POST',
      {
        showToasts: true,
        messages: {
          loading: 'Saving profile changes...',
          success: 'Profile updated successfully',
          error: 'Failed to update profile'
        },
        // Optimistic update function would go here if needed
        // optimisticUpdate: (data) => { ... }
      }
    );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile/edit');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      const user = session.user as ExtendedUser;
      setName(user.name || '');
      setBio(user.bio || '');
      setImage(user.image || '');
      setImagePreview(user.image || '');
    }
  }, [session]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large', { 
          description: 'Please select an image under 5MB' 
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(image); // Reset to original
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    setIsUploading(true);
    
    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append('file', imageFile);

      const toastId = toast.loading('Uploading image...');
      
      const uploadResponse = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      toast.success('Image uploaded', { id: toastId });
      
      return uploadData.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // First upload image if needed
      let imageUrl = image;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) return; // Stop if upload failed
        imageUrl = uploadedUrl;
      }

      // Update profile with the new mutation hook
      const result = await updateProfile({
        name,
        bio,
        image: imageUrl,
      });

      // Update the session with new user data
      if (result.success) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name,
            bio,
            image: imageUrl,
          },
        });
        
        // Navigate back to profile page
        router.push('/profile');
      }
    } catch (error) {
      // Error handling is done by the mutation hook
      console.error('Error in profile update flow:', error);
    }
  };
  
  // Reset error when leaving page
  useEffect(() => {
    return () => resetUpdateError();
  }, [resetUpdateError]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading profile data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Profile - MoodMash</title>
        <meta name="description" content="Edit your profile information" />
      </Head>
      <MainLayout>
        <div className="container max-w-2xl py-10">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <User className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="relative" disabled={isUploading}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                      />
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                    {imagePreview && imagePreview !== image && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={removeImage}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Maximum size: 5MB</p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Display Name
                  </label>
                  <input
                    id="name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your display name"
                    disabled={isSaving || isUploading}
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label htmlFor="bio" className="text-sm font-medium">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={4}
                    maxLength={160}
                    disabled={isSaving || isUploading}
                  />
                  <p className="text-xs text-muted-foreground">{bio.length}/160 characters</p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/profile')}
                  disabled={isSaving || isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving || isUploading}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </MainLayout>
    </>
  );
}
