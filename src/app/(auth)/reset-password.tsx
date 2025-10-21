import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from '@/providers/AuthProvider';
import type { FormErrors, ResetPasswordData } from '@/types/auth';
import { mvs, s } from "@/utils/scale";
import { ResetPasswordValidationSchema, ValidationUtils } from '@/utils/validation';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from "sonner-native";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      toast.error('This password reset link is invalid or has expired. Please request a new one.');
      setTimeout(() => {
        router.push('/(auth)/forgot-password');
      }, 1000);
      return;
    }

    try {
      await resetPassword(formData);
      setPasswordReset(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
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
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <SVGIcons.VarifiedGreen className="w-16 h-16" />
            </View>
            <ScaledText variant="2xl" className="text-foreground font-neueBold">Password Reset Successful</ScaledText>
            <ScaledText variant="body2" className="text-gray text-center">
              Your password has been successfully reset. You can now log in with your new password.
            </ScaledText>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleBackToLogin}
              className="bg-primary rounded-full"
              style={{ paddingVertical: mvs(10), paddingHorizontal: s(32) }}
            >
              <ScaledText variant="body1" className="text-foreground font-neueBold">Continue to Login</ScaledText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
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
            <SVGIcons.ChevronLeft className="w-6 h-6" />
          </TouchableOpacity>

          <View style={styles.header}>
            <ScaledText variant="2xl" className="text-foreground font-neueBold">Reset Your Password</ScaledText>
            <ScaledText variant="body2" className="text-gray text-center">Enter your new password below</ScaledText>
          </View>

          <View style={styles.form}>
            <ScaledText variant="sm" className="text-foreground mb-2">New Password</ScaledText>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl ${errors.password ? 'border-2 border-error' : 'border border-gray'}`}
              className="flex-1 text-foreground rounded-xl"
              placeholder="Enter your new password"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              rightAccessory={
                <TouchableOpacity
                  accessibilityRole="button"
                  className="px-3 py-2"
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword ? (
                    <SVGIcons.EyeOpen width={s(18)} height={s(18)} />
                  ) : (
                    <SVGIcons.EyeClose width={s(18)} height={s(18)} />
                  )}
                </TouchableOpacity>
              }
            />

            <View style={{ height: mvs(12) }} />

            <ScaledText variant="sm" className="text-foreground mb-2">Confirm New Password</ScaledText>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl ${errors.confirmPassword ? 'border-2 border-error' : 'border border-gray'}`}
              className="flex-1 text-foreground rounded-xl"
              placeholder="Confirm your new password"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              rightAccessory={
                <TouchableOpacity
                  accessibilityRole="button"
                  className="px-3 py-2"
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showConfirmPassword ? (
                    <SVGIcons.EyeOpen width={s(18)} height={s(18)} />
                  ) : (
                    <SVGIcons.EyeClose width={s(18)} height={s(18)} />
                  )}
                </TouchableOpacity>
              }
            />

            <View style={styles.passwordRequirements}>
              <ScaledText variant="body2" className="text-foreground font-montserratSemibold">Password requirements:</ScaledText>
              <ScaledText variant="body2" className="text-gray">
                • At least 8 characters long{"\n"}
                • Contains at least one number{"\n"}
                • Mix of letters and numbers recommended
              </ScaledText>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleResetPassword}
              disabled={loading}
              className="bg-primary rounded-full"
              style={[styles.resetButton, { paddingVertical: mvs(10), paddingHorizontal: s(32) }]}
            >
              <ScaledText variant="body1" className="text-foreground font-neueBold">Reset Password</ScaledText>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.loginLink}
              onPress={handleBackToLogin}
            >
              <ScaledText variant="body2" className="text-gray text-center">
                Remember your password? <ScaledText variant="body2" className="text-foreground font-montserratSemibold">Sign in</ScaledText>
              </ScaledText>
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
    backgroundColor: 'transparent',
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
  form: {
    flex: 1,
    marginBottom: 32,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
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
});
