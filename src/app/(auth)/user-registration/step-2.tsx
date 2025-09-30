import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useUserRegistration } from '@/providers/RegistrationProvider';
import type { FormErrors, UserRegistrationStep2 } from '@/types/auth';
import { UserStep2ValidationSchema, ValidationUtils } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserRegistrationStep2() {
  const { userRegistration, updateUserStep } = useUserRegistration();
  const [formData, setFormData] = useState<UserRegistrationStep2>({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (userRegistration.step2) {
      setFormData(userRegistration.step2);
    }
  }, [userRegistration.step2]);

  const handleInputChange = (field: keyof UserRegistrationStep2, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(formData, UserStep2ValidationSchema);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in registration context
    updateUserStep('step2', formData);
    router.push('/(auth)/user-registration/step-3');
  };

  const handleBack = () => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel your registration? Your progress will be lost.',
      [
        { text: 'Continue Registration', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: () => router.push('/(auth)/login')
        },
      ]
    );
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
            
            <StepIndicator currentStep={2} totalSteps={7} />
            
            <Text style={styles.title}>Personal Information</Text>
            <Text style={styles.subtitle}>
              This information is used only to register your account and will never be published on your profile
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

            <Input
              label="Phone Number"
              type="phone"
              placeholder="+39 123 456 7890"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              error={errors.phone}
              required
            />
          </View>

          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
            <Text style={styles.privacyText}>
              Your personal information is secure and will never be shared publicly
            </Text>
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
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 32,
  },
  privacyText: {
    fontSize: 12,
    color: '#166534',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  continueButton: {
    marginTop: 'auto',
  },
});
