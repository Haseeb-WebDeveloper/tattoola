import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useAuth } from '@/providers/AuthProvider';
import { useUserRegistrationStore } from '@/stores';
import type {
  FormErrors,
  UserRegistrationStep6
} from '@/types/auth';
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

export default function UserRegistrationStep6() {
  const { 
    step6, 
    updateStep, 
    clearRegistration,
    setCurrentStep 
  } = useUserRegistrationStore();
  
  const { completeUserRegistration, loading } = useAuth();
  const [formData, setFormData] = useState<UserRegistrationStep6>({
    isPublic: true,
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step6 && Object.keys(step6).length > 0) {
      setFormData(step6 as UserRegistrationStep6);
    }
  }, [step6]);

  const handleProfileTypeChange = (isPublic: boolean) => {
    setFormData(prev => ({ ...prev, isPublic }));
  };

  const validateForm = (): boolean => {
    // No validation needed for this step
    return true;
  };

  const handleComplete = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Store final step data
      updateStep('step6', formData);

      // Complete registration with all collected data
      // Get all step data from Zustand store
      const { step1, step2, step3, step4, step5 } = useUserRegistrationStore.getState();
      
      const completeData = {
        step1: step1 as any,
        step2: step2 as any,
        step3: step3 as any,
        step4: step4 as any,
        step5: step5 as any,
        step6: formData,
      };

      await completeUserRegistration(completeData);
      
      // Clear registration data
      clearRegistration();
      
      // Navigate to main app
      router.replace('/(tabs)');
      
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'An error occurred during registration',
        [{ text: 'OK' }]
      );
    }
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
            
            <StepIndicator currentStep={6} totalSteps={6} />
            
            <Text style={styles.title}>Profile Type</Text>
            <Text style={styles.subtitle}>
              Choose how much of your profile you want to share
            </Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={[
                styles.profileOption,
                formData.isPublic && styles.profileOptionSelected
              ]}
              onPress={() => handleProfileTypeChange(true)}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionIcon}>
                  <Ionicons name="globe" size={24} color={formData.isPublic ? "#FFFFFF" : "#000000"} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionTitle,
                    formData.isPublic && styles.optionTitleSelected
                  ]}>
                    Public Profile
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    formData.isPublic && styles.optionDescriptionSelected
                  ]}>
                    Your tattoos and followed artists will be visible on your page
                  </Text>
                </View>
                {formData.isPublic && (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.profileOption,
                !formData.isPublic && styles.profileOptionSelected
              ]}
              onPress={() => handleProfileTypeChange(false)}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionIcon}>
                  <Ionicons name="lock-closed" size={24} color={!formData.isPublic ? "#FFFFFF" : "#000000"} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionTitle,
                    !formData.isPublic && styles.optionTitleSelected
                  ]}>
                    Private Profile
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    !formData.isPublic && styles.optionDescriptionSelected
                  ]}>
                    Your tattoos and followed artists are visible only to you
                  </Text>
                </View>
                {!formData.isPublic && (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.privacyNote}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.privacyText}>
                You can change this setting anytime in your profile
              </Text>
            </View>
          </View>

          <Button
            title="Complete Registration"
            onPress={handleComplete}
            loading={loading}
            style={styles.completeButton}
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
  profileOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  profileOptionSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  optionTitleSelected: {
    color: '#FFFFFF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: '#D1D5DB',
  },
  checkIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
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
  completeButton: {
    marginTop: 'auto',
  },
});
