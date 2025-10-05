import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep8, FormErrors } from '@/types/auth';
import { supabase } from '@/utils/supabase';
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
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BodyPart {
  id: string;
  name: string;
  description: string;
}

export default function ArtistRegistrationStep8() {
  const { 
    step8, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useArtistRegistrationStore();
  const [formData, setFormData] = useState<ArtistRegistrationStep8>({
    bodyParts: [],
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (step8 && Object.keys(step8).length > 0) {
      setFormData(step8 as ArtistRegistrationStep8);
    }
  }, [step8]);

  // Load body parts on mount
  useEffect(() => {
    loadBodyParts();
  }, []);

  const loadBodyParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('body_parts')
        .select('id, name, description')
        .order('name');

      if (error) {
        console.error('Error loading body parts:', error);
        // Fallback to mock data
        const mockBodyParts = [
          { id: '1', name: 'Arms', description: 'Upper and lower arms' },
          { id: '2', name: 'Back', description: 'Upper and lower back' },
          { id: '3', name: 'Chest', description: 'Chest and torso area' },
          { id: '4', name: 'Legs', description: 'Thighs, calves, and feet' },
          { id: '5', name: 'Neck', description: 'Front and back of neck' },
          { id: '6', name: 'Hands', description: 'Hands and fingers' },
          { id: '7', name: 'Head', description: 'Scalp and face' },
          { id: '8', name: 'Ribs', description: 'Side torso area' },
          { id: '9', name: 'Shoulders', description: 'Shoulder blades and deltoids' },
          { id: '10', name: 'Stomach', description: 'Abdominal area' },
        ];
        setBodyParts(mockBodyParts);
      } else {
        setBodyParts(data || []);
      }
    } catch (error) {
      console.error('Error loading body parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBodyPartToggle = (bodyPartId: string) => {
    setFormData(prev => {
      const isSelected = prev.bodyParts.includes(bodyPartId);
      
      if (isSelected) {
        // Remove body part
        return {
          ...prev,
          bodyParts: prev.bodyParts.filter(id => id !== bodyPartId)
        };
      } else {
        // Add body part
        return {
          ...prev,
          bodyParts: [...prev.bodyParts, bodyPartId]
        };
      }
    });
  };

  const validateForm = (): boolean => {
    const formErrors: FormErrors = {};
    
    if (formData.bodyParts.length === 0) {
      formErrors.bodyParts = 'Please select at least one body part you work on';
    }
    
    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in registration context
    updateStep('step8', formData);
    setCurrentStep(9);
    router.push('/(auth)/artist-registration/step-9');
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading body parts...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            
            <StepIndicator currentStep={8} totalSteps={11} />
            
            <Text style={styles.title}>Body Parts Worked On</Text>
            <Text style={styles.subtitle}>
              Select the body parts you specialize in tattooing
            </Text>
            <Text style={styles.counter}>
              {formData.bodyParts.length} body part{formData.bodyParts.length !== 1 ? 's' : ''} selected
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.bodyPartsGrid}>
              {bodyParts.map((bodyPart) => {
                const isSelected = formData.bodyParts.includes(bodyPart.id);
                return (
                  <TouchableOpacity
                    key={bodyPart.id}
                    style={[
                      styles.bodyPartCard,
                      isSelected && styles.bodyPartCardSelected
                    ]}
                    onPress={() => handleBodyPartToggle(bodyPart.id)}
                  >
                    <View style={styles.bodyPartContent}>
                      <Text style={[
                        styles.bodyPartName,
                        isSelected && styles.bodyPartNameSelected
                      ]}>
                        {bodyPart.name}
                      </Text>
                      <Text style={[
                        styles.bodyPartDescription,
                        isSelected && styles.bodyPartDescriptionSelected
                      ]}>
                        {bodyPart.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {errors.bodyParts && (
              <Text style={styles.errorText}>{errors.bodyParts}</Text>
            )}

            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                This helps clients find artists who work on their desired body parts
              </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
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
    marginBottom: 8,
  },
  counter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  bodyPartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bodyPartCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  bodyPartCardSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  bodyPartContent: {
    flex: 1,
  },
  bodyPartName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  bodyPartNameSelected: {
    color: '#FFFFFF',
  },
  bodyPartDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  bodyPartDescriptionSelected: {
    color: '#D1D5DB',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  continueButton: {
    marginTop: 'auto',
  },
});
