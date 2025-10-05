import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep3, FormErrors } from '@/types/auth';
import { WorkArrangement } from '@/types/auth';
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

export default function ArtistRegistrationStep3() {
  const { 
    step3, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useArtistRegistrationStore();
  const [formData, setFormData] = useState<ArtistRegistrationStep3>({
    workArrangement: WorkArrangement.STUDIO_OWNER,
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step3 && Object.keys(step3).length > 0) {
      setFormData(step3 as ArtistRegistrationStep3);
    }
  }, [step3]);

  const handleArrangementSelect = (arrangement: WorkArrangement) => {
    setFormData(prev => ({ ...prev, workArrangement: arrangement }));
  };

  const validateForm = (): boolean => {
    // No validation needed for this step
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in registration context
    updateStep('step3', formData);
    setCurrentStep(4);
    router.push('/(auth)/artist-registration/step-4');
  };

  const handleBack = () => {
    router.back();
  };

  const arrangements = [
    {
      id: 'STUDIO_OWNER',
      title: 'I am the owner of my own studio',
      description: 'You own and operate your own tattoo studio',
      icon: 'business',
    },
    {
      id: 'STUDIO_EMPLOYEE',
      title: 'I am a tattoo artist working in a studio',
      description: 'You work as an employee at a tattoo studio',
      icon: 'people',
    },
    {
      id: 'FREELANCE',
      title: 'I am a freelance tattoo artist',
      description: 'You work independently, not tied to a specific studio',
      icon: 'person',
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
            
            <StepIndicator currentStep={3} totalSteps={11} />
            
            <Text style={styles.title}>Working Arrangements</Text>
            <Text style={styles.subtitle}>
              How do you work as a tattoo artist?
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.optionsContainer}>
              {arrangements.map((arrangement) => (
                <TouchableOpacity
                  key={arrangement.id}
                  style={[
                    styles.optionCard,
                    formData.workArrangement === arrangement.id && styles.optionCardSelected
                  ]}
                  onPress={() => handleArrangementSelect(arrangement.id as any)}
                >
                  <View style={styles.optionHeader}>
                    <View style={[
                      styles.optionIcon,
                      formData.workArrangement === arrangement.id && styles.optionIconSelected
                    ]}>
                      <Ionicons 
                        name={arrangement.icon as any} 
                        size={24} 
                        color={formData.workArrangement === arrangement.id ? "#FFFFFF" : "#000000"} 
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[
                        styles.optionTitle,
                        formData.workArrangement === arrangement.id && styles.optionTitleSelected
                      ]}>
                        {arrangement.title}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        formData.workArrangement === arrangement.id && styles.optionDescriptionSelected
                      ]}>
                        {arrangement.description}
                      </Text>
                    </View>
                    {formData.workArrangement === arrangement.id && (
                      <View style={styles.checkIcon}>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
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
  optionsContainer: {
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionCardSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionIconSelected: {
    backgroundColor: '#374151',
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
  continueButton: {
    marginTop: 'auto',
  },
});