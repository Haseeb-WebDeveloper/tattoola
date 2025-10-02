import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cloudinaryService } from '@/services/cloudinary.service';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep4, FormErrors } from '@/types/auth';
import { supabase } from '@/utils/supabase';
import { ArtistStep5ValidationSchema, ValidationUtils } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ArtistRegistrationStep4() {
  const { 
    step4, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useArtistRegistrationStore();
  
  const { pickFiles, uploadToCloudinary, uploading, uploadedFiles } = useFileUpload();
  const [formData, setFormData] = useState<ArtistRegistrationStep4>({
    businessName: '',
    province: '',
    municipality: '',
    studioAddress: '',
    website: '',
    phone: '',
    certificateUrl: '',
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showMunicipalityModal, setShowMunicipalityModal] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (step4 && Object.keys(step4).length > 0) {
      setFormData(step4 as ArtistRegistrationStep4);
    }
  }, [step4]);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load municipalities when province changes
  useEffect(() => {
    if (formData.province) {
      loadMunicipalities(formData.province);
    } else {
      setMunicipalities([]);
    }
  }, [formData.province]);

  const loadProvinces = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('provinces')
        .select('id, name')
        .eq('isActive', true)
        .order('name');

      if (error) {
        console.error('Error loading provinces:', error);
      }
      setProvinces(data || []);
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipalities = async (provinceId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('municipalities')
        .select('id, name')
        .eq('provinceId', provinceId)
        .eq('isActive', true)
        .order('name');

      if (error) {
        console.error('Error loading municipalities:', error);
      }
      setMunicipalities(data || []);
    } catch (error) {
      console.error('Error loading municipalities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ArtistRegistrationStep4, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setLocalErrors(prev => ({ ...prev, [field]: '' }));
      clearErrors();
    }
  };

  const handleCertificationUpload = async () => {
    try {
      const files = await pickFiles({
        mediaType: 'all',
        allowsMultipleSelection: true,
        maxFiles: 5,
        cloudinaryOptions: cloudinaryService.getCertificateUploadOptions(),
      });

      if (files.length > 0) {
        const uploadedFiles = await uploadToCloudinary(files, cloudinaryService.getCertificateUploadOptions());
        const uploadedUrls = uploadedFiles
          .filter(file => file.cloudinaryResult)
          .map(file => file.cloudinaryResult!.secureUrl);
        
        setFormData(prev => ({
          ...prev,
          certificateUrl: uploadedUrls[0] || '',
        }));
      }
    } catch (error) {
      console.error('Certificate upload error:', error);
      Alert.alert('Error', 'Failed to upload certificates. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(formData, ArtistStep5ValidationSchema);
    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in Zustand store
    updateStep('step4', formData);
    setCurrentStep(5);
    router.push('/(auth)/artist-registration/step-5');
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
            
            <StepIndicator currentStep={4} totalSteps={13} />
            
            <Text style={styles.title}>Business Information</Text>
            <Text style={styles.subtitle}>
              Tell us about your studio or business
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Studio/Business Name"
              placeholder="Enter your studio name"
              value={formData.businessName}
              onChangeText={(value) => handleInputChange('businessName', value)}
              error={errors.businessName}
              required
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Province *</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowProvinceModal(true)}
              >
                <Text style={styles.dropdownText}>
                  {formData.province ? provinces.find(p => p.id === formData.province)?.name : 'Select Province'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666666" />
              </TouchableOpacity>
              {errors.province && (
                <Text style={styles.errorText}>{errors.province}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Municipality/Comune *</Text>
              <TouchableOpacity 
                style={[styles.dropdown, !formData.province && styles.dropdownDisabled]}
                onPress={() => formData.province && setShowMunicipalityModal(true)}
                disabled={!formData.province}
              >
                <Text style={[styles.dropdownText, !formData.province && styles.dropdownTextDisabled]}>
                  {formData.municipality ? municipalities.find(m => m.id === formData.municipality)?.name : 'Select Municipality'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={formData.province ? "#666666" : "#CCCCCC"} />
              </TouchableOpacity>
              {errors.municipality && (
                <Text style={styles.errorText}>{errors.municipality}</Text>
              )}
            </View>

            <Input
              label="Studio Address"
              placeholder="Enter your studio address"
              value={formData.studioAddress}
              onChangeText={(value) => handleInputChange('studioAddress', value)}
              error={errors.studioAddress}
              required
              multiline
              numberOfLines={3}
            />

            <Input
              label="Website (Optional)"
              placeholder="https://yourwebsite.com"
              value={formData.website}
              onChangeText={(value) => handleInputChange('website', value)}
              error={errors.website}
              keyboardType="url"
            />

            <Input
              label="Phone Number"
              placeholder="+39 123 456 7890"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              error={errors.phone}
              keyboardType="phone-pad"
              required
            />

            <View style={styles.certificationsSection}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <Text style={styles.sectionSubtitle}>
                Upload your certificates and ID copy
              </Text>
              
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleCertificationUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.uploadingContainer}>
                    <Ionicons name="cloud-upload" size={24} color="#3B82F6" />
                    <Text style={styles.uploadButtonText}>Uploading...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={24} color="#3B82F6" />
                    <Text style={styles.uploadButtonText}>Upload Certificates</Text>
                    <Text style={styles.uploadSubtext}>PDF, JPG, PNG up to 10MB each</Text>
                  </>
                )}
              </TouchableOpacity>

              {formData.certificateUrl && (
                <View style={styles.uploadedFiles}>
                  <Text style={styles.uploadedFilesTitle}>Uploaded Certificate:</Text>
                  <View style={styles.fileItem}>
                    <Ionicons name="document" size={16} color="#666666" />
                    <Text style={styles.fileName} numberOfLines={1}>
                      Certificate
                    </Text>
                    <TouchableOpacity
                      style={styles.removeFileButton}
                      onPress={() => {
                        setFormData(prev => ({
                          ...prev,
                          certificateUrl: '',
                        }));
                      }}
                    >
                      <Ionicons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
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

      {/* Province Selection Modal */}
      <Modal
        visible={showProvinceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProvinceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Province</Text>
              <TouchableOpacity
                onPress={() => setShowProvinceModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {provinces.map((province) => (
                <TouchableOpacity
                  key={province.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, province: province.id, municipality: '' }));
                    setShowProvinceModal(false);
                    setMunicipalities([]);
                  }}
                >
                  <Text style={styles.modalItemText}>{province.name}</Text>
                  {formData.province === province.id && (
                    <Ionicons name="checkmark" size={20} color="#166534" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Municipality Selection Modal */}
      <Modal
        visible={showMunicipalityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMunicipalityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Municipality</Text>
              <TouchableOpacity
                onPress={() => setShowMunicipalityModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {municipalities.map((municipality) => (
                <TouchableOpacity
                  key={municipality.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, municipality: municipality.id }));
                    setShowMunicipalityModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{municipality.name}</Text>
                  {formData.municipality === municipality.id && (
                    <Ionicons name="checkmark" size={20} color="#166534" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  certificationsSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  uploadedFiles: {
    marginTop: 16,
  },
  uploadedFilesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  fileName: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  removeFileButton: {
    padding: 4,
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    marginTop: 'auto',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  dropdownDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  dropdownTextDisabled: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
});
