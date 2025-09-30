import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { SelectableCard } from './SelectableCard';

interface MultiSelectOption {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  maxSelections?: number;
  minSelections?: number;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  error?: string;
}

export function MultiSelect({
  options,
  selectedIds,
  onSelectionChange,
  maxSelections,
  minSelections = 0,
  title,
  subtitle,
  style,
  error,
}: MultiSelectProps) {
  const handleOptionPress = (optionId: string) => {
    const isSelected = selectedIds.includes(optionId);
    
    if (isSelected) {
      // Deselect if already selected
      const newSelection = selectedIds.filter(id => id !== optionId);
      if (newSelection.length >= minSelections) {
        onSelectionChange(newSelection);
      }
    } else {
      // Select if not selected and under max limit
      if (!maxSelections || selectedIds.length < maxSelections) {
        onSelectionChange([...selectedIds, optionId]);
      }
    }
  };

  const renderOption = ({ item }: { item: MultiSelectOption }) => {
    const isSelected = selectedIds.includes(item.id);
    const isDisabled = !isSelected && maxSelections && selectedIds.length >= maxSelections;
    
    return (
      <SelectableCard
        title={item.title}
        description={item.description}
        icon={item.icon}
        selected={isSelected}
        disabled={isDisabled}
        onPress={() => handleOptionPress(item.id)}
      />
    );
  };

  return (
    <View style={[styles.container, style]}>
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      
      {maxSelections && (
        <Text style={styles.counter}>
          {selectedIds.length} of {maxSelections} selected
        </Text>
      )}
      
      <FlatList
        data={options}
        renderItem={renderOption}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  counter: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#FF0000',
    marginTop: 8,
  },
});
