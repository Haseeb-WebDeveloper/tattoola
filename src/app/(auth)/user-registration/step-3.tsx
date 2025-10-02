import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cloudinaryService } from '@/services/cloudinary.service';
import { useUserRegistrationStore } from '@/stores';
import type { FormErrors, UserRegistrationStep3 } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserRegistrationStep3() {
  const { 
    step3, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useUserRegistrationStore();
  const { pickFiles, takePhoto, uploadToCloudinary, uploading } = useFileUpload();
  const [formData, setFormData] = useState<UserRegistrationStep3>({
    avatar: undefined,
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step3 && Object.keys(step3).length > 0) {
      setFormData(step3 as UserRegistrationStep3);
    }
  }, [step3]);

  const handleImageSelect = async () => {
    try {
      Alert.alert(
        'Select Photo',
        'Choose how you want to add your profile photo',
        [
          { text: 'Camera', onPress: () => handleTakePhoto() },
          { text: 'Gallery', onPress: () => handlePickFromGallery() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const files = await takePhoto({
        mediaType: 'image',
        maxFiles: 1,
        cloudinaryOptions: cloudinaryService.getAvatarUploadOptions(),
      });

      if (files.length > 0) {
        const uploadedFiles = await uploadToCloudinary(files, cloudinaryService.getAvatarUploadOptions());
        if (uploadedFiles[0]?.cloudinaryResult) {
          // Use the transformed URL for display
          const transformedUrl = cloudinaryService.getAvatarUrl(uploadedFiles[0].cloudinaryResult.publicId);
          setFormData(prev => ({
            ...prev,
            avatar: transformedUrl,
          }));
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const files = await pickFiles({
        mediaType: 'image',
        maxFiles: 1,
        cloudinaryOptions: cloudinaryService.getAvatarUploadOptions(),
      });

      if (files.length > 0) {
        const uploadedFiles = await uploadToCloudinary(files, cloudinaryService.getAvatarUploadOptions());
        if (uploadedFiles[0]?.cloudinaryResult) {
          // Use the transformed URL for display
          const transformedUrl = cloudinaryService.getAvatarUrl(uploadedFiles[0].cloudinaryResult.publicId);
          setFormData(prev => ({
            ...prev,
            avatar: transformedUrl,
          }));
        }
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleSkip = () => {
    // Store data in registration context
    updateStep('step3', formData);
    setCurrentStep(4);
    router.push('/(auth)/user-registration/step-4');
  };

  const handleNext = () => {
    // Store data in registration context
    updateStep('step3', formData);
    setCurrentStep(4);
    router.push('/(auth)/user-registration/step-4');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={24} color="#000000" />
            </TouchableOpacity>
            
            <StepIndicator currentStep={3} totalSteps={6} />
            
            <Text style={styles.title}>Profile Photo</Text>
            <Text style={styles.subtitle}>
              Add a photo to help others recognize you (optional)
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.avatarContainer}>
              {formData.avatar ? (
                <View style={styles.avatarPreview}>
                  <Image
                    source={{ uri: formData.avatar }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={handleImageSelect}
                    disabled={uploading}
                  >
                    <Text style={styles.changeButtonText}>
                      {uploading ? 'Uploading...' : 'Change Photo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.avatarPlaceholder}
                  onPress={handleImageSelect}
                  disabled={uploading}
                >
                  {uploading ? (
                    <View style={styles.uploadingContainer}>
                      <Ionicons name="cloud-upload" size={48} color="#3B82F6" />
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="camera" size={48} color="#666666" />
                      <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
                      <Text style={styles.avatarSubtext}>JPG, PNG up to 5MB</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
              <Text style={styles.privacyText}>
                Your photo is only visible to people you connect with
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Skip for now"
              onPress={handleSkip}
              variant="outline"
              style={styles.skipButton}
            />
            <Button
              title="Continue"
              onPress={handleNext}
              style={styles.continueButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  form: {
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changeButton: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#000000',
    borderRadius: 20,
  },
  changeButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 8,
  },
  avatarPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginTop: 8,
  },
  avatarSubtext: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
  },
  privacyText: {
    fontSize: 12,
    color: '#166534',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  actions: {
    gap: 12,
  },
  skipButton: {
    marginBottom: 8,
  },
  continueButton: {
    marginTop: 'auto',
  },
});
