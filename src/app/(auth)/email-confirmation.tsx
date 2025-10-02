import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmailConfirmationScreen() {
  const { resendVerificationEmail, loading } = useAuth();
  const [emailSent, setEmailSent] = useState(false);

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail();
      setEmailSent(true);
      Alert.alert(
        'Email Sent',
        'We\'ve sent a new verification email. Please check your inbox.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send verification email',
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
        <LoadingSpinner message="Sending verification email..." overlay />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-unread" size={64} color="#000000" />
          </View>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We&apos;ve sent a verification email to your inbox. Please click the link in the email to verify your account and continue.
          </Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>What to do next:</Text>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Check your email inbox for a message from Tattoola
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Click the verification link in the email
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Complete your profile setup
            </Text>
          </View>
        </View>

        <View style={styles.troubleshooting}>
          <Text style={styles.troubleTitle}>Don&apos;t see the email?</Text>
          <Text style={styles.troubleText}>
            • Check your spam or junk folder{'\n'}
            • Make sure you entered the correct email address{'\n'}
            • Wait a few minutes for the email to arrive
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Resend Verification Email"
            onPress={handleResendEmail}
            variant="outline"
            loading={loading}
            style={styles.resendButton}
          />
          
          <TouchableOpacity
            style={styles.backLink}
            onPress={handleBackToLogin}
          >
            <Text style={styles.backText}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
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
    paddingHorizontal: 16,
  },
  instructions: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  troubleshooting: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  troubleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  troubleText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  actions: {
    alignItems: 'center',
    gap: 16,
  },
  resendButton: {
    width: '100%',
  },
  backLink: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});
