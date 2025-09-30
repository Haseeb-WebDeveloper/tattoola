import { cn } from '@/utils/cn';
import React from 'react';
import {
  ActivityIndicator,
  Text,
  View,
  ViewStyle,
} from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  overlay?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 'large',
  color = '#FFFFFF',
  message,
  overlay = false,
  className,
  style,
}: LoadingSpinnerProps) {
  const containerClasses = cn(
    'items-center justify-center p-5',
    overlay && 'absolute top-0 left-0 right-0 bottom-0 bg-background/80 z-50',
    className
  );

  return (
    <View className={containerClasses} style={style}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-sm mt-3 text-center text-foreground" style={{ color }}>
          {message}
        </Text>
      )}
    </View>
  );
}