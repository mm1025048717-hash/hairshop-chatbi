import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  type: 'good' | 'warning' | 'tip';
  title: string;
  content: string;
  action?: string;
  onAction?: () => void;
}

/**
 * AI洞察卡片 - 苹果风格，无icon
 */
export function InsightCard({ type, title, content, action, onAction }: Props) {
  const typeConfig = {
    good: { bg: 'rgba(52, 199, 89, 0.08)', border: '#34C759', text: '#34C759' },
    warning: { bg: 'rgba(255, 149, 0, 0.08)', border: '#FF9500', text: '#FF9500' },
    tip: { bg: 'rgba(0, 122, 255, 0.08)', border: '#007AFF', text: '#007AFF' },
  };

  const config = typeConfig[type];

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderLeftColor: config.border }]}>
      <Text style={[styles.title, { color: config.text }]}>{title}</Text>
      <Text style={styles.content}>{content}</Text>
      {action && onAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.actionText, { color: config.border }]}>{action} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 18,
    borderLeftWidth: 4,
    marginVertical: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  content: {
    fontSize: 14,
    color: '#1D1D1F',
    lineHeight: 21,
  },
  actionBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
