import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep1, FormErrors } from '@/types/auth';
import { ArtistStep2ValidationSchema, ValidationUtils } from '@/utils/validation';
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

export default function ArtistRegistrationStep1() {
  const { 
    step1, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useArtistRegistrationStore();
  
  const [formData, setFormData] = useState<ArtistRegistrationStep1>({
    firstName: '',
    lastName: '',
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step1 && Object.keys(step1).length > 0) {
      setFormData(step1 as ArtistRegistrationStep1);
    }
  }, [step1]);

  const handleInputChange = (field: keyof ArtistRegistrationStep1, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setLocalErrors(prev => ({ ...prev, [field]: '' }));
      clearErrors();
    }
  };

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(formData, ArtistStep2ValidationSchema);
    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in Zustand store
    updateStep('step1', formData);
    setCurrentStep(2);
    router.push('/(auth)/artist-registration/step-2');
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
            
            <StepIndicator currentStep={1} totalSteps={11} />
            
            <Text style={styles.title}>Personal Information</Text>
            <Text style={styles.subtitle}>
              Tell us about yourself
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="First Name"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              error={errors.firstName}
              required
            />

            <Input
              label="Last Name"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              error={errors.lastName}
              required
            />
          </View>

          <Button
            title="Continue"
            onPress={handleNext}
            style={styles.continueButton}
          />
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
  continueButton: {
    marginTop: 'auto',
  },
});
