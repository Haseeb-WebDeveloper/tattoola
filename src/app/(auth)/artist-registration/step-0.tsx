import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep0, FormErrors } from '@/types/auth';
import { ValidationUtils } from '@/utils/validation';
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

export default function ArtistRegistrationStep0() {
  const { 
    step0, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useArtistRegistrationStore();
  
  const [formData, setFormData] = useState<ArtistRegistrationStep0>({
    selectedPlan: 'BASIC',
    agreesToTerms: false,
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step0 && Object.keys(step0).length > 0) {
      setFormData(step0 as ArtistRegistrationStep0);
    }
  }, [step0]);

  const handlePlanSelect = (plan: 'BASIC' | 'PREMIUM' | 'STUDIO') => {
    setFormData(prev => ({ ...prev, selectedPlan: plan }));
  };

  const handleTermsToggle = () => {
    setFormData(prev => ({ ...prev, agreesToTerms: !prev.agreesToTerms }));
  };

  const validateForm = (): boolean => {
    const formErrors: FormErrors = {};
    
    if (!formData.agreesToTerms) {
      formErrors.agreesToTerms = 'You must agree to the Terms of Service';
    }
    
    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in Zustand store
    updateStep('step0', formData);
    setCurrentStep(1);
    router.push('/(auth)/artist-registration/step-1');
  };

  const handleBack = () => {
    router.back();
  };

  const plans = [
    {
      id: 'BASIC',
      name: 'Basic',
      price: 'Free',
      description: 'Perfect for getting started',
      features: [
        'Up to 6 jobs',
        'One main preferred style',
        'Access to private requests only',
      ],
      popular: false,
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      price: '€39/month',
      description: 'For serious artists',
      features: [
        'Unlimited jobs organized in collections',
        'Up to 2 main preferred styles',
        'Priority access to customer requests',
        'Add years of experience',
        'Add cover photo/video to page',
      ],
      popular: true,
    },
    {
      id: 'STUDIO',
      name: 'Studio',
      price: '€79/month',
      description: 'For studios and teams',
      features: [
        'Link multiple artist accounts under same studio',
        'Up to 3 main preferred styles',
        'Create studio page',
        'Priority access and campaign discounts',
      ],
      popular: false,
    },
  ];

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
            
            <StepIndicator currentStep={0} totalSteps={13} />
            
            <Text style={styles.title}>Choose Your Plan</Text>
            <Text style={styles.subtitle}>
              Select the plan that best fits your needs. You can upgrade anytime.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.plansContainer}>
              {plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    formData.selectedPlan === plan.id && styles.planCardSelected,
                    plan.popular && styles.popularPlan,
                  ]}
                  onPress={() => handlePlanSelect(plan.id as any)}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>Most Popular</Text>
                    </View>
                  )}
                  
                  <View style={styles.planHeader}>
                    <Text style={[
                      styles.planName,
                      formData.selectedPlan === plan.id && styles.planNameSelected
                    ]}>
                      {plan.name}
                    </Text>
                    <Text style={[
                      styles.planPrice,
                      formData.selectedPlan === plan.id && styles.planPriceSelected
                    ]}>
                      {plan.price}
                    </Text>
                    <Text style={[
                      styles.planDescription,
                      formData.selectedPlan === plan.id && styles.planDescriptionSelected
                    ]}>
                      {plan.description}
                    </Text>
                  </View>

                  <View style={styles.featuresList}>
                    {plan.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons 
                          name="checkmark-circle" 
                          size={16} 
                          color={formData.selectedPlan === plan.id ? "#22C55E" : "#666666"} 
                        />
                        <Text style={[
                          styles.featureText,
                          formData.selectedPlan === plan.id && styles.featureTextSelected
                        ]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {formData.selectedPlan === plan.id && (
                    <View style={styles.selectedIcon}>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
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
                  By clicking &apos;Next,&apos; you agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                </Text>
              </TouchableOpacity>
              {errors.agreesToTerms && (
                <Text style={styles.errorText}>{errors.agreesToTerms}</Text>
              )}
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
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  planCardSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  popularPlan: {
    borderColor: '#3B82F6',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  planNameSelected: {
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  planPriceSelected: {
    color: '#60A5FA',
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
  },
  planDescriptionSelected: {
    color: '#D1D5DB',
  },
  featuresList: {
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  featureTextSelected: {
    color: '#D1D5DB',
  },
  selectedIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsContainer: {
    marginBottom: 16,
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
  continueButton: {
    marginTop: 'auto',
  },
});
