import { cn } from '@/utils/cn';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  className?: string;
  inputClassName?: string;
  type?: 'text' | 'email' | 'password' | 'phone' | 'number';
}

export function Input({
  label,
  error,
  required,
  containerStyle,
  className,
  inputClassName,
  type = 'text',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const hasError = !!error;

  const getKeyboardType = () => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const containerClasses = cn('mb-4', className);
  
  const inputContainerClasses = cn(
    'flex-row items-center border rounded-lg bg-card',
    isFocused ? 'border-foreground' : 'border-border',
    hasError && 'border-error'
  );

  const inputClasses = cn(
    'flex-1 px-4 py-3 text-base text-background min-h-11 ',
    isPassword && 'pr-12',
    inputClassName
  );

  return (
    <View className={containerClasses} style={containerStyle}>
      {label && (
        <Text className="text-sm font-neueMedium text-foreground mb-2">
          {label}
          {required && <Text className="text-error"> *</Text>}
        </Text>
      )}
      
      <View className={inputContainerClasses}>
        <TextInput
          className={inputClasses}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={getKeyboardType()}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            className="absolute right-4 p-1"
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#00000093"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {hasError && (
        <Text className="text-xs text-error mt-1">{error}</Text>
      )}
    </View>
  );
}