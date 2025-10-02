import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useUserRegistrationStore } from '@/stores';
import type { FormErrors, UserRegistrationStep4 } from '@/types/auth';
import { UserStep5ValidationSchema, ValidationUtils } from '@/utils/validation';
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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserRegistrationStep4() {
  const { 
    step4, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useUserRegistrationStore();
  const [formData, setFormData] = useState<UserRegistrationStep4>({
    instagram: '',
    tiktok: '',
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step4 && Object.keys(step4).length > 0) {
      setFormData(step4 as UserRegistrationStep4);
    }
  }, [step4]);

  const handleInputChange = (field: keyof UserRegistrationStep4, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setLocalErrors(prev => ({ ...prev, [field]: '' }));
      clearErrors();
    }
  };

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(formData, UserStep5ValidationSchema);
    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in registration context
    updateStep('step4', formData);
    setCurrentStep(5);
    router.push('/(auth)/user-registration/step-5');
  };

  const handleSkip = () => {
    // Store data in registration context
    updateStep('step4', formData);
    setCurrentStep(5);
    router.push('/(auth)/user-registration/step-5');
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
            
            <StepIndicator currentStep={4} totalSteps={6} />
            
            <Text style={styles.title}>Social Media</Text>
            <Text style={styles.subtitle}>
              Connect your social accounts to showcase your style (optional)
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.socialInput}>
              <View style={styles.socialIcon}>
                <Ionicons name="logo-instagram" size={24} color="#E4405F" />
              </View>
              <Input
                label="Instagram Username"
                placeholder="@username"
                value={formData.instagram}
                onChangeText={(value) => handleInputChange('instagram', value)}
                error={errors.instagram}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.socialInput}>
              <View style={styles.socialIcon}>
                <Ionicons name="logo-tiktok" size={24} color="#000000" />
              </View>
              <Input
                label="TikTok Username"
                placeholder="@username"
                value={formData.tiktok}
                onChangeText={(value) => handleInputChange('tiktok', value)}
                error={errors.tiktok}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.privacyNote}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.privacyText}>
                These will be visible on your public profile to help others discover your content
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
  socialInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
  },
  privacyText: {
    fontSize: 12,
    color: '#1E40AF',
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
