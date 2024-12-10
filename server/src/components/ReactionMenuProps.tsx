import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text } from '@rneui/themed';
import { REACTIONS } from '../config';
import { colors, spacing, borderRadius } from '../../../theme';

interface ReactionsMenuProps {
  visible: boolean;
  onSelect: (reaction: string) => void;
}

export default function ReactionsMenu({ onSelect, visible }: ReactionsMenuProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      {REACTIONS.map((reaction: string) => (
        <TouchableOpacity
          key={reaction}
          onPress={() => {
            console.log('Emoji pressed:', reaction);
            onSelect(reaction);
          }}
          style={styles.reactionButton}
        >
          <Text style={styles.reactionText}>{reaction}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  reactionButton: {
    padding: 4,
    borderRadius: borderRadius.sm,
  },
  reactionText: {
    fontSize: 24,
  },
});
