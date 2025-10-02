import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/providers/AuthProvider';
import type { ForgotPasswordData, FormErrors } from '@/types/auth';
import { ForgotPasswordValidationSchema, ValidationUtils } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

export default function ForgotPasswordScreen() {
  const { forgotPassword, loading } = useAuth();
  const [formData, setFormData] = useState<ForgotPasswordData>({
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailSent, setEmailSent] = useState(false);

  const handleInputChange = (field: keyof ForgotPasswordData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(formData, ForgotPasswordValidationSchema);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleSendResetEmail = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await forgotPassword(formData);
      setEmailSent(true);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send reset email',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBackToLogin = () => {
    router.push('/(auth)/login');
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleSendResetEmail();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Sending reset email..." overlay />
      </SafeAreaView>
    );
  }

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={64} color="#000000" />
            </View>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We&apos;ve sent a password reset link to{'\n'}
              <Text style={styles.email}>{formData.email}</Text>
            </Text>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Click the link in the email to reset your password. If you don&apos;t see the email, check your spam folder.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="Back to Login"
              onPress={handleBackToLogin}
              style={styles.backButton}
            />
            
            <TouchableOpacity
              style={styles.resendLink}
              onPress={handleResendEmail}
            >
              <Text style={styles.resendText}>
                Didn&apos;t receive the email? Resend
              </Text>
            </TouchableOpacity>
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
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we&apos;ll send you a link to reset your password
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              error={errors.email}
              required
            />

            <Button
              title="Send Reset Link"
              onPress={handleSendResetEmail}
              loading={loading}
              style={styles.sendButton}
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
  email: {
    fontWeight: '600',
    color: '#000000',
  },
  instructions: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    flex: 1,
    marginBottom: 32,
  },
  sendButton: {
    marginTop: 24,
  },
  actions: {
    alignItems: 'center',
    gap: 24,
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
  resendLink: {
    padding: 8,
  },
  resendText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'center',
  },
});
