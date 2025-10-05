import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep7, FormErrors } from '@/types/auth';
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

interface Service {
  id: string;
  name: string;
  description: string;
}

export default function ArtistRegistrationStep7() {
  const { 
    step7, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useArtistRegistrationStore();
  const [formData, setFormData] = useState<ArtistRegistrationStep7>({
    servicesOffered: [],
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (step7 && Object.keys(step7).length > 0) {
      setFormData(step7 as ArtistRegistrationStep7);
    }
  }, [step7]);

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description')
        .order('name');

      if (error) {
        console.error('Error loading services:', error);
        // Fallback to mock data
        const mockServices = [
          { id: '1', name: 'Custom Tattoo Design', description: 'Original designs created specifically for you' },
          { id: '2', name: 'Tattoo Consultation', description: 'Professional advice on design and placement' },
          { id: '3', name: 'Cover-up Tattoos', description: 'Transform existing tattoos with new designs' },
          { id: '4', name: 'Touch-up Services', description: 'Refresh and enhance existing tattoos' },
          { id: '5', name: 'Tattoo Removal Consultation', description: 'Advice on tattoo removal options' },
          { id: '6', name: 'Piercing Services', description: 'Body piercing and jewelry consultation' },
        ];
        setServices(mockServices);
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => {
      const isSelected = prev.servicesOffered.includes(serviceId);
      
      if (isSelected) {
        // Remove service
        return {
          ...prev,
          servicesOffered: prev.servicesOffered.filter(id => id !== serviceId)
        };
      } else {
        // Add service
        return {
          ...prev,
          servicesOffered: [...prev.servicesOffered, serviceId]
        };
      }
    });
  };

  const validateForm = (): boolean => {
    const formErrors: FormErrors = {};
    
    if (formData.servicesOffered.length === 0) {
      formErrors.servicesOffered = 'Please select at least one service you offer';
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
    updateStep('step7', formData);
    setCurrentStep(8);
    router.push('/(auth)/artist-registration/step-8');
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading services...</Text>
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
            
            <StepIndicator currentStep={7} totalSteps={11} />
            
            <Text style={styles.title}>Services Offered</Text>
            <Text style={styles.subtitle}>
              Select all the services you provide to clients
            </Text>
            <Text style={styles.counter}>
              {formData.servicesOffered.length} service{formData.servicesOffered.length !== 1 ? 's' : ''} selected
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.servicesGrid}>
              {services.map((service) => {
                const isSelected = formData.servicesOffered.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      isSelected && styles.serviceCardSelected
                    ]}
                    onPress={() => handleServiceToggle(service.id)}
                  >
                    <View style={styles.serviceContent}>
                      <Text style={[
                        styles.serviceName,
                        isSelected && styles.serviceNameSelected
                      ]}>
                        {service.name}
                      </Text>
                      <Text style={[
                        styles.serviceDescription,
                        isSelected && styles.serviceDescriptionSelected
                      ]}>
                        {service.description}
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

            {errors.servicesOffered && (
              <Text style={styles.errorText}>{errors.servicesOffered}</Text>
            )}

            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                You can add or remove services anytime from your profile settings
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  serviceCardSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  serviceNameSelected: {
    color: '#FFFFFF',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  serviceDescriptionSelected: {
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
