import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { TL_MAX_FAVORITE_STYLES } from '@/constants/limits';
import { useUserRegistrationStore } from '@/stores';
import type { FormErrors, UserRegistrationStep5 } from '@/types/auth';
import { supabase } from '@/utils/supabase';
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

export default function UserRegistrationStep5() {
  const { 
    step5, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useUserRegistrationStore();
  const [formData, setFormData] = useState<UserRegistrationStep5>({
    favoriteStyles: [],
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [tattooStyles, setTattooStyles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (step5 && Object.keys(step5).length > 0) {
      setFormData(step5 as UserRegistrationStep5);
    }
  }, [step5]);

  // Load tattoo styles on mount
  useEffect(() => {
    loadTattooStyles();
  }, []);

  const loadTattooStyles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tattoo_styles')
        .select('id, name, description')
        .eq('isActive', true)
        .order('name');

      if (error) {
        console.error('Error loading tattoo styles:', error);
        // Fallback to mock data
        const mockStyles = [
          { id: '1', name: '3D', description: 'Three-dimensional tattoos' },
          { id: '2', name: 'Abstract', description: 'Non-representational designs' },
          { id: '3', name: 'Anime', description: 'Japanese animation style' },
          { id: '4', name: 'Black & Grey', description: 'Monochrome shading' },
          { id: '5', name: 'Color', description: 'Full color tattoos' },
          { id: '6', name: 'Geometric', description: 'Mathematical patterns' },
          { id: '7', name: 'Japanese', description: 'Traditional Japanese style' },
          { id: '8', name: 'Realistic', description: 'Photorealistic designs' },
          { id: '9', name: 'Traditional', description: 'Classic tattoo style' },
          { id: '10', name: 'Watercolor', description: 'Painterly effect' },
        ];
        setTattooStyles(mockStyles);
      } else {
        setTattooStyles(data || []);
      }
    } catch (error) {
      console.error('Error loading tattoo styles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStyleToggle = (styleId: string) => {
    setFormData(prev => {
      const isSelected = prev.favoriteStyles.includes(styleId);
      let newStyles;
      
      if (isSelected) {
        // Remove style
        newStyles = prev.favoriteStyles.filter(id => id !== styleId);
      } else {
        // Add style (check limit)
        if (prev.favoriteStyles.length >= TL_MAX_FAVORITE_STYLES) {
          Alert.alert(
            'Selection Limit',
            `You can select up to ${TL_MAX_FAVORITE_STYLES} favorite styles.`,
            [{ text: 'OK' }]
          );
          return prev;
        }
        newStyles = [...prev.favoriteStyles, styleId];
      }
      
      return { ...prev, favoriteStyles: newStyles };
    });
  };

  const validateForm = (): boolean => {
    const formErrors: FormErrors = {};
    
    if (formData.favoriteStyles.length === 0) {
      formErrors.favoriteStyles = 'Please select at least one favorite style';
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
    updateStep('step5', formData);
    setCurrentStep(6);
    router.push('/(auth)/user-registration/step-6');
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
            
            <StepIndicator currentStep={5} totalSteps={6} />
            
            <Text style={styles.title}>Favorite Styles</Text>
            <Text style={styles.subtitle}>
              Choose up to {TL_MAX_FAVORITE_STYLES} tattoo styles you love
            </Text>
            <Text style={styles.counter}>
              {formData.favoriteStyles.length} of {TL_MAX_FAVORITE_STYLES} selected
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.stylesGrid}>
              {tattooStyles.map((style) => {
                const isSelected = formData.favoriteStyles.includes(style.id);
                return (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.styleCard,
                      isSelected && styles.styleCardSelected
                    ]}
                    onPress={() => handleStyleToggle(style.id)}
                  >
                    <View style={styles.styleContent}>
                      <Text style={[
                        styles.styleName,
                        isSelected && styles.styleNameSelected
                      ]}>
                        {style.name}
                      </Text>
                      <Text style={[
                        styles.styleDescription,
                        isSelected && styles.styleDescriptionSelected
                      ]}>
                        {style.description}
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

            {errors.favoriteStyles && (
              <Text style={styles.errorText}>{errors.favoriteStyles}</Text>
            )}
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
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  styleCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  styleCardSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  styleContent: {
    flex: 1,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  styleNameSelected: {
    color: '#FFFFFF',
  },
  styleDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  styleDescriptionSelected: {
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
  continueButton: {
    marginTop: 'auto',
  },
});
