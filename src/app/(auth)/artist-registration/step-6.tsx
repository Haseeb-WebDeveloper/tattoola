import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { AR_MAX_FAVORITE_STYLES } from '@/constants/limits';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep6, FormErrors } from '@/types/auth';
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

interface TattooStyle {
  id: string;
  name: string;
  description: string;
}

export default function ArtistRegistrationStep6() {
  const { 
    step6, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useArtistRegistrationStore();
  const [formData, setFormData] = useState<ArtistRegistrationStep6>({
    favoriteStyles: [],
    mainStyleId: '',
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [tattooStyles, setTattooStyles] = useState<TattooStyle[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (step6 && Object.keys(step6).length > 0) {
      setFormData(step6 as ArtistRegistrationStep6);
    }
  }, [step6]);

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
        // If this was the main style, clear it
        const newMainStyleId = prev.mainStyleId === styleId ? '' : prev.mainStyleId;
        return { ...prev, favoriteStyles: newStyles, mainStyleId: newMainStyleId };
      } else {
        // Add style (check limit)
        if (prev.favoriteStyles.length >= AR_MAX_FAVORITE_STYLES) {
          Alert.alert(
            'Selection Limit',
            `You can select up to ${AR_MAX_FAVORITE_STYLES} favorite styles.`,
            [{ text: 'OK' }]
          );
          return prev;
        }
        newStyles = [...prev.favoriteStyles, styleId];
        // If this is the first style, set it as main
        const newMainStyleId = prev.favoriteStyles.length === 0 ? styleId : prev.mainStyleId;
        return { ...prev, favoriteStyles: newStyles, mainStyleId: newMainStyleId };
      }
    });
  };

  const handleMainStyleSelect = (styleId: string) => {
    setFormData(prev => ({ ...prev, mainStyleId: styleId }));
  };

  const validateForm = (): boolean => {
    const formErrors: FormErrors = {};
    
    if (formData.favoriteStyles.length === 0) {
      formErrors.favoriteStyles = 'Please select at least one favorite style';
    }
    
    if (!formData.mainStyleId) {
      formErrors.mainStyleId = 'Please select your main style';
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
    updateStep('step6', formData);
    setCurrentStep(7);
    router.push('/(auth)/artist-registration/step-7');
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading styles...</Text>
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
            
            <StepIndicator currentStep={6} totalSteps={11} />
            
            <Text style={styles.title}>Favorite Styles</Text>
            <Text style={styles.subtitle}>
              Choose up to {AR_MAX_FAVORITE_STYLES} tattoo styles you specialize in
            </Text>
            <Text style={styles.counter}>
              {formData.favoriteStyles.length} of {AR_MAX_FAVORITE_STYLES} selected
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.stylesGrid}>
              {tattooStyles.map((style) => {
                const isSelected = formData.favoriteStyles.includes(style.id);
                const isMain = formData.mainStyleId === style.id;
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

            {formData.favoriteStyles.length > 0 && (
              <View style={styles.mainStyleSection}>
                <Text style={styles.mainStyleTitle}>Select Your Main Style</Text>
                <Text style={styles.mainStyleSubtitle}>
                  This will be your primary style shown to clients
                </Text>
                <View style={styles.mainStyleOptions}>
                  {formData.favoriteStyles.map((styleId) => {
                    const style = tattooStyles.find(s => s.id === styleId);
                    if (!style) return null;
                    return (
                      <TouchableOpacity
                        key={styleId}
                        style={[
                          styles.mainStyleOption,
                          formData.mainStyleId === styleId && styles.mainStyleOptionSelected
                        ]}
                        onPress={() => handleMainStyleSelect(styleId)}
                      >
                        <Text style={[
                          styles.mainStyleOptionText,
                          formData.mainStyleId === styleId && styles.mainStyleOptionTextSelected
                        ]}>
                          {style.name}
                        </Text>
                        {formData.mainStyleId === styleId && (
                          <Ionicons name="star" size={16} color="#F59E0B" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {errors.favoriteStyles && (
              <Text style={styles.errorText}>{errors.favoriteStyles}</Text>
            )}
            {errors.mainStyleId && (
              <Text style={styles.errorText}>{errors.mainStyleId}</Text>
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
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  mainStyleSection: {
    marginBottom: 16,
  },
  mainStyleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  mainStyleSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  mainStyleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mainStyleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mainStyleOptionSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  mainStyleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 4,
  },
  mainStyleOptionTextSelected: {
    color: '#FFFFFF',
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
