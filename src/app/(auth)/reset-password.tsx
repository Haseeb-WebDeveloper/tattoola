import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/providers/AuthProvider';
import type { FormErrors, ResetPasswordData } from '@/types/auth';
import { ResetPasswordValidationSchema, ValidationUtils } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
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

export default function ResetPasswordScreen() {
  const { resetPassword, loading } = useAuth();
  const { token } = useLocalSearchParams<{ token: string }>();
  
  const [formData, setFormData] = useState<ResetPasswordData>({
    token: token || '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordReset, setPasswordReset] = useState(false);

  const handleInputChange = (field: keyof ResetPasswordData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const validationRules = {
      ...ResetPasswordValidationSchema,
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
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    if (!token) {
      Alert.alert(
        'Invalid Link',
        'This password reset link is invalid or has expired. Please request a new one.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/forgot-password') }]
      );
      return;
    }

    try {
      await resetPassword(formData);
      setPasswordReset(true);
    } catch (error) {
      Alert.alert(
        'Reset Failed',
        error instanceof Error ? error.message : 'Failed to reset password',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBackToLogin = () => {
    router.push('/(auth)/login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Resetting password..." overlay />
      </SafeAreaView>
    );
  }

  if (passwordReset) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
            </View>
            <Text style={styles.title}>Password Reset Successful</Text>
            <Text style={styles.subtitle}>
              Your password has been successfully reset. You can now log in with your new password.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="Continue to Login"
              onPress={handleBackToLogin}
              style={styles.continueButton}
            />
          </View>
        </ScrollView>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password below
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="New Password"
              type="password"
              placeholder="Enter your new password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              error={errors.password}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm your new password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              error={errors.confirmPassword}
              required
            />

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password requirements:</Text>
              <Text style={styles.requirementsText}>
                • At least 8 characters long{'\n'}
                • Contains at least one number{'\n'}
                • Mix of letters and numbers recommended
              </Text>
            </View>

            <Button
              title="Reset Password"
              onPress={handleResetPassword}
              loading={loading}
              style={styles.resetButton}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.loginLink}
              onPress={handleBackToLogin}
            >
              <Text style={styles.loginText}>
                Remember your password? <Text style={styles.loginHighlight}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingVertical: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
    marginBottom: 32,
  },
  passwordRequirements: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  requirementsText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
  resetButton: {
    marginTop: 8,
  },
  actions: {
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
  },
  loginLink: {
    padding: 8,
  },
  loginText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  loginHighlight: {
    color: '#000000',
    fontWeight: '600',
  },
});
