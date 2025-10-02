import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cloudinaryService } from '@/services/cloudinary.service';
import { useArtistRegistrationStore } from '@/stores';
import type { ArtistRegistrationStep10, FormErrors, PortfolioProject } from '@/types/auth';
import { supabase } from '@/utils/supabase';
import { ValidationUtils } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TattooStyle {
  id: string;
  name: string;
}

interface Project {
  id: string;
  photos: string[];
  videos: string[];
  description: string;
  associatedStyles: string[];
}

export default function ArtistRegistrationStep10() {
  const { 
    step10, 
    updateStep, 
    setErrors, 
    clearErrors,
    setCurrentStep 
  } = useArtistRegistrationStore();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const [formData, setFormData] = useState<ArtistRegistrationStep10>({
    projects: [],
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [tattooStyles, setTattooStyles] = useState<TattooStyle[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (step10 && Object.keys(step10).length > 0) {
      setFormData(step10 as ArtistRegistrationStep10);
    }
  }, [step10]);

  // Load tattoo styles on mount
  useEffect(() => {
    loadTattooStyles();
  }, []);

  const loadTattooStyles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tattoo_styles')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error loading tattoo styles:', error);
        // Fallback to mock data
        const mockStyles = [
          { id: '1', name: '3D' },
          { id: '2', name: 'Abstract' },
          { id: '3', name: 'Anime' },
          { id: '4', name: 'Black & Grey' },
          { id: '5', name: 'Color' },
          { id: '6', name: 'Geometric' },
          { id: '7', name: 'Japanese' },
          { id: '8', name: 'Realistic' },
          { id: '9', name: 'Traditional' },
          { id: '10', name: 'Watercolor' },
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

  const addProject = () => {
    if (formData.projects.length >= 4) {
      Alert.alert(
        'Project Limit',
        'You can add up to 4 favorite projects.',
        [{ text: 'OK' }]
      );
      return;
    }

    setFormData(prev => {
      const newProject: PortfolioProject = {
        id: Date.now().toString(),
        title: '',
        description: '',
        photos: [],
        videos: [],
        associatedStyles: [],
        order: prev.projects.length,
      };

      return {
        ...prev,
        projects: [...prev.projects, newProject]
      };
    });
  };

  const removeProject = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId)
    }));
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      )
    }));
  };

  const handlePhotoUpload = async (projectId: string) => {
    try {
      const files = await pickFiles({
        mediaType: 'image',
        allowsMultipleSelection: true,
        maxFiles: 5,
        cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions('image'),
      });

      if (files.length > 0) {
        const uploadedFiles = await uploadToCloudinary(files, cloudinaryService.getPortfolioUploadOptions('image'));
        const uploadedUrls = uploadedFiles
          .filter(file => file.cloudinaryResult)
          .map(file => file.cloudinaryResult!.secureUrl);
        
        updateProject(projectId, {
          photos: [...(formData.projects.find(p => p.id === projectId)?.photos || []), ...uploadedUrls],
        });
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', 'Failed to upload photos. Please try again.');
    }
  };

  const handleVideoUpload = async (projectId: string) => {
    try {
      const files = await pickFiles({
        mediaType: 'video',
        allowsMultipleSelection: true,
        maxFiles: 2,
        cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions('video'),
      });

      if (files.length > 0) {
        const uploadedFiles = await uploadToCloudinary(files, cloudinaryService.getPortfolioUploadOptions('video'));
        const uploadedUrls = uploadedFiles
          .filter(file => file.cloudinaryResult)
          .map(file => file.cloudinaryResult!.secureUrl);
        
        updateProject(projectId, {
          videos: [...(formData.projects.find(p => p.id === projectId)?.videos || []), ...uploadedUrls],
        });
      }
    } catch (error) {
      console.error('Video upload error:', error);
      Alert.alert('Error', 'Failed to upload videos. Please try again.');
    }
  };

  const handleStyleToggle = (projectId: string, styleId: string) => {
    const project = formData.projects.find(p => p.id === projectId);
    if (!project) return;

    const isSelected = project.associatedStyles.includes(styleId);
    const newStyles = isSelected
      ? project.associatedStyles.filter(id => id !== styleId)
      : [...project.associatedStyles, styleId];

    updateProject(projectId, { associatedStyles: newStyles });
  };

  const validateForm = (): boolean => {
    const formErrors: FormErrors = {};
    
    if (formData.projects.length === 0) {
      formErrors.projects = 'Please add at least one favorite project';
    }
    
    // Validate each project
    formData.projects.forEach((project, index) => {
      if (!project.description.trim()) {
        formErrors[`project_${index}_description`] = 'Description is required';
      }
      if (project.photos.length === 0 && project.videos.length === 0) {
        formErrors[`project_${index}_media`] = 'At least one photo or video is required';
      }
      if (project.associatedStyles.length === 0) {
        formErrors[`project_${index}_styles`] = 'At least one style must be selected';
      }
    });
    
    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in registration context
    updateStep('step10', formData);
    setCurrentStep(13);
    router.push('/(auth)/artist-registration/step-13');
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
            
            <StepIndicator currentStep={10} totalSteps={10} />
            
            <Text style={styles.title}>Portfolio Setup</Text>
            <Text style={styles.subtitle}>
              Add up to 4 of your favorite projects to showcase your work
            </Text>
            <Text style={styles.counter}>
              {formData.projects.length} of 4 projects added
            </Text>
          </View>

          <View style={styles.form}>
            {formData.projects.map((project, index) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectTitle}>Project {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeProject(project.id)}
                  >
                    <Ionicons name="close" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.mediaSection}>
                  <Text style={styles.sectionLabel}>Photos & Videos</Text>
                  <View style={styles.mediaButtons}>
                    <TouchableOpacity
                      style={[styles.mediaButton, uploading && styles.mediaButtonDisabled]}
                      onPress={() => handlePhotoUpload(project.id)}
                      disabled={uploading}
                    >
                      <Ionicons name="camera" size={20} color={uploading ? "#999999" : "#3B82F6"} />
                      <Text style={[styles.mediaButtonText, uploading && styles.mediaButtonTextDisabled]}>
                        {uploading ? 'Uploading...' : `Add Photos (${project.photos.length}/5)`}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.mediaButton, uploading && styles.mediaButtonDisabled]}
                      onPress={() => handleVideoUpload(project.id)}
                      disabled={uploading}
                    >
                      <Ionicons name="videocam" size={20} color={uploading ? "#999999" : "#3B82F6"} />
                      <Text style={[styles.mediaButtonText, uploading && styles.mediaButtonTextDisabled]}>
                        {uploading ? 'Uploading...' : `Add Videos (${project.videos.length}/2)`}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Show uploaded media previews */}
                  {(project.photos.length > 0 || project.videos.length > 0) && (
                    <View style={styles.mediaPreview}>
                      <Text style={styles.mediaPreviewTitle}>Uploaded Media:</Text>
                      <View style={styles.mediaGrid}>
                        {project.photos.map((photo, photoIndex) => (
                          <View key={photoIndex} style={styles.mediaItem}>
                            <Image source={{ uri: photo }} style={styles.mediaThumbnail} />
                            <TouchableOpacity
                              style={styles.removeMediaButton}
                              onPress={() => {
                                updateProject(project.id, {
                                  photos: project.photos.filter((_, i) => i !== photoIndex),
                                });
                              }}
                            >
                              <Ionicons name="close" size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                        {project.videos.map((video, videoIndex) => (
                          <View key={`video-${videoIndex}`} style={styles.mediaItem}>
                            <View style={styles.videoThumbnail}>
                              <Ionicons name="play" size={20} color="#FFFFFF" />
                            </View>
                            <TouchableOpacity
                              style={styles.removeMediaButton}
                              onPress={() => {
                                updateProject(project.id, {
                                  videos: project.videos.filter((_, i) => i !== videoIndex),
                                });
                              }}
                            >
                              <Ionicons name="close" size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {errors[`project_${index}_media`] && (
                    <Text style={styles.errorText}>{errors[`project_${index}_media`]}</Text>
                  )}
                </View>

                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionLabel}>Description/Meaning</Text>
                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="Describe this project and its meaning..."
                    value={project.description}
                    onChangeText={(value) => updateProject(project.id, { description: value })}
                    multiline
                    numberOfLines={3}
                  />
                  {errors[`project_${index}_description`] && (
                    <Text style={styles.errorText}>{errors[`project_${index}_description`]}</Text>
                  )}
                </View>

                <View style={styles.stylesSection}>
                  <Text style={styles.sectionLabel}>Associated Styles</Text>
                  <View style={styles.stylesGrid}>
                    {tattooStyles.map((style) => {
                      const isSelected = project.associatedStyles.includes(style.id);
                      return (
                        <TouchableOpacity
                          key={style.id}
                          style={[
                            styles.styleChip,
                            isSelected && styles.styleChipSelected
                          ]}
                          onPress={() => handleStyleToggle(project.id, style.id)}
                        >
                          <Text style={[
                            styles.styleChipText,
                            isSelected && styles.styleChipTextSelected
                          ]}>
                            {style.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {errors[`project_${index}_styles`] && (
                    <Text style={styles.errorText}>{errors[`project_${index}_styles`]}</Text>
                  )}
                </View>
              </View>
            ))}

            {formData.projects.length < 4 && (
              <TouchableOpacity
                style={styles.addProjectButton}
                onPress={addProject}
              >
                <Ionicons name="add" size={24} color="#3B82F6" />
                <Text style={styles.addProjectText}>Add Project</Text>
              </TouchableOpacity>
            )}

            {errors.projects && (
              <Text style={styles.errorText}>{errors.projects}</Text>
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
  projectCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  removeButton: {
    padding: 4,
  },
  mediaSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mediaButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 8,
  },
  mediaButtonDisabled: {
    opacity: 0.6,
  },
  mediaButtonTextDisabled: {
    color: '#999999',
  },
  mediaPreview: {
    marginTop: 12,
  },
  mediaPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaItem: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  mediaThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  videoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  stylesSection: {
    marginBottom: 8,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  styleChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  styleChipText: {
    fontSize: 12,
    color: '#374151',
  },
  styleChipTextSelected: {
    color: '#FFFFFF',
  },
  addProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addProjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
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
