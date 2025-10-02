import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep9, FormErrors } from '@/types/auth';
import { ArtistStep11ValidationSchema, ValidationUtils } from '@/utils/validation';
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

export default function ArtistRegistrationStep9() {
  const { 
    step9, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useArtistRegistrationStore();
  const [formData, setFormData] = useState<ArtistRegistrationStep9>({
    minimumPrice: undefined,
    hourlyRate: undefined,
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step9 && Object.keys(step9).length > 0) {
      setFormData(step9 as ArtistRegistrationStep9);
    }
  }, [step9]);

  const handleInputChange = (field: keyof ArtistRegistrationStep9, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parsed = numericValue === '' ? undefined : Number(numericValue);
    setFormData(prev => ({ ...prev, [field]: parsed }));
    
    // Clear error for this field
    if (errors[field]) {
      setLocalErrors(prev => ({ ...prev, [field]: '' }));
      clearErrors();
    }
  };

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(formData, ArtistStep11ValidationSchema);
    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in registration context
    updateStep('step9', formData);
    setCurrentStep(10);
    router.push('/(auth)/artist-registration/step-10');
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
            
            <StepIndicator currentStep={9} totalSteps={13} />
            
            <Text style={styles.title}>Rates</Text>
            <Text style={styles.subtitle}>
              Set your pricing to help clients understand your rates
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Minimum Price (€)"
              placeholder="50"
              value={formData.minimumPrice !== undefined ? String(formData.minimumPrice) : ''}
              onChangeText={(value) => handleInputChange('minimumPrice', value)}
              error={errors.minimumPrice}
              keyboardType="numeric"
              required
            />

            <Input
              label="Hourly Rate (€) - Optional"
              placeholder="80"
              value={formData.hourlyRate !== undefined ? String(formData.hourlyRate) : ''}
              onChangeText={(value) => handleInputChange('hourlyRate', value)}
              error={errors.hourlyRate}
              keyboardType="numeric"
            />

            <View style={styles.pricingInfo}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View style={styles.pricingInfoContent}>
                <Text style={styles.pricingInfoTitle}>Pricing Guidelines</Text>
                <Text style={styles.pricingInfoText}>
                  • Minimum price is the lowest amount you charge for any tattoo{'\n'}
                  • Hourly rate helps clients estimate larger pieces{'\n'}
                  • You can adjust these rates anytime in your profile
                </Text>
              </View>
            </View>

            <View style={styles.exampleContainer}>
              <Text style={styles.exampleTitle}>Example Pricing:</Text>
              <View style={styles.exampleItem}>
                <Text style={styles.exampleLabel}>Small tattoo (2-3 hours):</Text>
                <Text style={styles.exampleValue}>
                  €{typeof formData.hourlyRate === 'number' ? (formData.hourlyRate * 2.5).toFixed(0) : 'N/A'}
                </Text>
              </View>
              <View style={styles.exampleItem}>
                <Text style={styles.exampleLabel}>Medium tattoo (4-6 hours):</Text>
                <Text style={styles.exampleValue}>
                  €{typeof formData.hourlyRate === 'number' ? (formData.hourlyRate * 5).toFixed(0) : 'N/A'}
                </Text>
              </View>
              <View style={styles.exampleItem}>
                <Text style={styles.exampleLabel}>Large tattoo (8+ hours):</Text>
                <Text style={styles.exampleValue}>
                  €{typeof formData.hourlyRate === 'number' ? (formData.hourlyRate * 8).toFixed(0) : 'N/A'}
                </Text>
              </View>
            </View>
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
  pricingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  pricingInfoContent: {
    flex: 1,
    marginLeft: 8,
  },
  pricingInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  pricingInfoText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  exampleContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  exampleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  exampleLabel: {
    fontSize: 14,
    color: '#666666',
  },
  exampleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  continueButton: {
    marginTop: 'auto',
  },
});
