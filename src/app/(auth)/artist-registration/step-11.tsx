import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useAuth } from '@/providers/AuthProvider';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep11, FormErrors } from '@/types/auth';
import { ValidationUtils } from '@/utils/validation';
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

export default function ArtistRegistrationStep11() {
  const { 
    step0, step1, step2, step3, step4, step5, step6, step7, step8, step9, step10, step11,
    updateStep, 
    clearRegistration,
    setCurrentStep 
  } = useArtistRegistrationStore();
  const { completeArtistRegistration, loading } = useAuth();
  const [formData, setFormData] = useState<ArtistRegistrationStep11>({
    agreesToTerms: false,
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step11 && Object.keys(step11).length > 0) {
      setFormData(step11 as ArtistRegistrationStep11);
    }
  }, [step11]);

  const handleTermsToggle = () => {
    setFormData(prev => ({ ...prev, agreesToTerms: !prev.agreesToTerms }));
  };

  const validateForm = (): boolean => {
    const formErrors: FormErrors = {};
    
    if (!formData.agreesToTerms) {
      formErrors.agreesToTerms = 'You must agree to the Terms of Service';
    }
    
    setLocalErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleComplete = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Store final step data
      updateStep('step11', formData);

      // Complete registration with all collected data
      // Get all step data from Zustand store
      const { step0, step1, step2, step3, step4, step5, step6, step7, step8, step9, step10 } = useArtistRegistrationStore.getState();
      
      const completeData = {
        step0: step0 as any,
        step1: step1 as any,
        step2: step2 as any,
        step3: step3 as any,
        step4: step4 as any,
        step5: step5 as any,
        step6: step6 as any,
        step7: step7 as any,
        step8: step8 as any,
        step9: step9 as any,
        step10: step10 as any,
        step11: formData,
      };

      await completeArtistRegistration(completeData);
      
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
            
            <StepIndicator currentStep={10} totalSteps={10} />
            
            <Text style={styles.title}>Complete Registration</Text>
            <Text style={styles.subtitle}>
              Review your information and complete your artist profile
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Registration Summary</Text>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Plan:</Text>
                <Text style={styles.summaryValue}>
                  {(step1 as any)?.selectedPlan || 'BASIC'}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Name:</Text>
                <Text style={styles.summaryValue}>
                  {(step2 as any)?.firstName} {(step2 as any)?.lastName}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Studio:</Text>
                <Text style={styles.summaryValue}>
                  {(step5 as any)?.businessName || 'Not specified'}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Working Arrangement:</Text>
                <Text style={styles.summaryValue}>
                  {(step4 as any)?.workArrangement === 'STUDIO_OWNER' ? 'Studio Owner' :
                   (step4 as any)?.workArrangement === 'STUDIO_EMPLOYEE' ? 'Studio Employee' :
                   'Freelance Artist'}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Favorite Styles:</Text>
                <Text style={styles.summaryValue}>
                  {(step7 as any)?.favoriteStyles?.length || 0} selected
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Services:</Text>
                <Text style={styles.summaryValue}>
                  {(step8 as any)?.services?.length || 0} selected
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Portfolio Projects:</Text>
                <Text style={styles.summaryValue}>
                  {(step10 as any)?.projects?.length || 0} projects
                </Text>
              </View>
            </View>

            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.termsCheckbox}
                onPress={handleTermsToggle}
              >
                <View style={[
                  styles.checkbox,
                  formData.agreesToTerms && styles.checkboxChecked
                ]}>
                  {formData.agreesToTerms && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.termsText}>
                  By clicking &apos;Complete Registration,&apos; you agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              {errors.agreesToTerms && (
                <Text style={styles.errorText}>{errors.agreesToTerms}</Text>
              )}
            </View>

            <View style={styles.welcomeNote}>
              <Ionicons name="sparkles" size={24} color="#F59E0B" />
              <Text style={styles.welcomeText}>
                Welcome to Tattoola! Your artist profile will be live once you complete registration.
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
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  termsText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  welcomeNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
  },
  welcomeText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  completeButton: {
    marginTop: 'auto',
  },
});
