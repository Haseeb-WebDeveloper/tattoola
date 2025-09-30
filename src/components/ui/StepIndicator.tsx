import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  style?: ViewStyle;
}

export function StepIndicator({ currentStep, totalSteps, style }: StepIndicatorProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(currentStep / totalSteps) * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.stepText}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
});
