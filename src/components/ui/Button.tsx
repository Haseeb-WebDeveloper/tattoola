import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { cn } from '@/utils/cn';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className,
  textClassName,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-foreground';
      case 'secondary':
        return 'bg-muted';
      case 'outline':
        return 'bg-transparent border border-border';
      case 'ghost':
        return 'bg-transparent';
      default:
        return 'bg-foreground';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2 min-h-8';
      case 'medium':
        return 'px-4 py-3 min-h-11';
      case 'large':
        return 'px-6 py-4 min-h-13';
      default:
        return 'px-4 py-3 min-h-11';
    }
  };

  const getTextVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-background';
      case 'secondary':
        return 'text-foreground';
      case 'outline':
        return 'text-foreground';
      case 'ghost':
        return 'text-foreground';
      default:
        return 'text-background';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const buttonClasses = cn(
    'rounded-lg items-center justify-center flex-row',
    getVariantClasses(),
    getSizeClasses(),
    isDisabled && 'opacity-50',
    className
  );

  const textClasses = cn(
    'font-semibold text-center',
    getTextVariantClasses(),
    getTextSizeClasses(),
    isDisabled && 'opacity-70',
    textClassName
  );

  return (
    <TouchableOpacity
      className={buttonClasses}
      style={style}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#000000' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text
          className={textClasses}
          style={textStyle}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}