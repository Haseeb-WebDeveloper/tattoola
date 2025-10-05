import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep5, FormErrors } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ArtistRegistrationStep5() {
  const { 
    step5, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useArtistRegistrationStore();
  const [formData, setFormData] = useState<ArtistRegistrationStep5>({
    bio: '',
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step5 && Object.keys(step5).length > 0) {
      setFormData(step5 as ArtistRegistrationStep5);
    }
  }, [step5]);

  const handleInputChange = (field: keyof ArtistRegistrationStep5, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setLocalErrors(prev => ({ ...prev, [field]: '' }));
      clearErrors();
    }
  };

  const handleSkip = () => {
    // Store data in registration context
    updateStep('step5', formData);
    setCurrentStep(6);
    router.push('/(auth)/artist-registration/step-6');
  };

  const handleNext = () => {
    // Store data in registration context
    updateStep('step5', formData);
    setCurrentStep(6);
    router.push('/(auth)/artist-registration/step-6');
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
            
            <StepIndicator currentStep={5} totalSteps={11} />
            
            <Text style={styles.title}>About You</Text>
            <Text style={styles.subtitle}>
              Write a short description about yourself (optional)
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.bioContainer}>
              <Text style={styles.bioLabel}>Bio</Text>
              <Input
                placeholder="Tell us about your experience, style, and what makes you unique as a tattoo artist..."
                value={formData.bio}
                onChangeText={(value) => handleInputChange('bio', value)}
                error={errors.bio}
                multiline
                numberOfLines={6}
                style={styles.bioInput}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {formData.bio.length}/500 characters
              </Text>
            </View>

            <View style={styles.tipsContainer}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.tipsText}>
                Tip: Share your experience, specializations, and what clients can expect from working with you.
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
  bioContainer: {
    marginBottom: 16,
  },
  bioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  bioInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginTop: 4,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
  },
  tipsText: {
    fontSize: 12,
    color: '#92400E',
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
