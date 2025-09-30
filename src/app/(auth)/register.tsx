import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/providers/AuthProvider';
import type { FormErrors, RegisterCredentials } from '@/types/auth';
import { UserRole } from '@/types/auth';
import { RegisterValidationSchema, ValidationUtils } from '@/utils/validation';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const { signUp, loading } = useAuth();
  const [formData, setFormData] = useState<RegisterCredentials>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.TATTOO_LOVER,
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: keyof RegisterCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const validationRules = {
      ...RegisterValidationSchema,
      confirmPassword: {
        required: true,
        custom: (value: string) => {
          if (value !== formData.password) {
            return 'Passwords do not match';
          }
          return true;
        },
      },
    };

    const formErrors = ValidationUtils.validateForm(formData, validationRules);
    
    if (!acceptedTerms) {
      formErrors.terms = 'You must accept the Terms of Use and Privacy Policy';
    }
    
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await signUp(formData);
      
      if (result.needsVerification) {
        Alert.alert(
          'Registration Successful',
          'Please check your email to verify your account before continuing.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(auth)/email-confirmation'),
            },
          ]
        );
      } else {
        // Navigate to user registration flow
        router.push('/(auth)/user-registration/step-2');
      }
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'An error occurred during registration',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleArtistRegister = () => {
    router.push('/(auth)/artist-register');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <LoadingSpinner message="Creating your account..." overlay />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 py-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-12">
            <Text className="text-3xl font-bold text-foreground text-center mb-2">
              Join Tattoola
            </Text>
            <Text className="text-base text-muted-foreground text-center">
              Create your account
            </Text>
          </View>

          <View className="flex-1 mb-8">
            <Input
              label="Username"
              placeholder="Choose a unique username"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              error={errors.username}
              required
              autoCapitalize="none"
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Password (min 8 characters, 1 number)"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              error={errors.password}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              error={errors.confirmPassword}
              required
            />

            <View className="mb-6">
              <Checkbox
                checked={acceptedTerms}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                label="I have read the Terms of Use and Privacy Policy"
              />
              {errors.terms && (
                <Text className="text-xs text-error mt-1">{errors.terms}</Text>
              )}
            </View>

            <Button
              title="Register"
              onPress={handleRegister}
              loading={loading}
              className="mt-2"
            />
          </View>

          <View className="items-center gap-4">
            <TouchableOpacity
              className="p-2"
              onPress={handleLogin}
            >
              <Text className="text-base text-muted-foreground text-center">
                Already have an account?{" "}
                <Text className="text-foreground font-semibold">Log in</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-2"
              onPress={handleArtistRegister}
            >
              <Text className="text-base text-foreground font-medium text-center">
                Or are you an Artist?
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}