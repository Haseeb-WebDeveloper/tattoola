import { cn } from '@/utils/cn';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export function Checkbox({
  checked,
  onPress,
  label,
  disabled = false,
  className,
  labelClassName,
  style,
  labelStyle,
}: CheckboxProps) {
  const containerClasses = cn(
    'flex-row items-center',
    className
  );

  const checkboxClasses = cn(
    'w-5 h-5 border-2 rounded items-center justify-center',
    checked ? 'bg-foreground border-foreground' : 'bg-card border-border',
    disabled && 'opacity-50'
  );

  const labelClasses = cn(
    'text-sm text-foreground ml-3 flex-1',
    disabled && 'opacity-50',
    labelClassName
  );

  return (
    <TouchableOpacity
      className={containerClasses}
      style={style}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View className={checkboxClasses}>
        {checked && (
          <Ionicons
            name="checkmark"
            size={16}
            color="#000000"
          />
        )}
      </View>
      
      {label && (
        <Text
          className={labelClasses}
          style={labelStyle}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}