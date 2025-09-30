import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface SelectableCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
  icon?: string;
  disabled?: boolean;
}

export function SelectableCard({
  title,
  description,
  selected,
  onPress,
  style,
  icon,
  disabled = false,
}: SelectableCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.selected,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={icon as any} 
              size={24} 
              color={selected ? '#FFFFFF' : '#666666'} 
            />
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, selected && styles.selectedText]}>
            {title}
          </Text>
          {description && (
            <Text style={[styles.description, selected && styles.selectedDescription]}>
              {description}
            </Text>
          )}
        </View>
        
        <View style={styles.checkContainer}>
          {selected && (
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  selected: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  selectedDescription: {
    color: '#E0E0E0',
  },
  checkContainer: {
    marginLeft: 12,
  },
});
