import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { DailyStats } from '../types';

interface Props {
  stats: DailyStats;
  onPress?: () => void;
}

export function StatsCard({ stats, onPress }: Props) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>今日收入</Text>
          <Text style={styles.income}>¥{stats.totalIncome}</Text>
        </View>
        <View style={styles.subRow}>
          <Text style={styles.subText}>支出 ¥{stats.totalExpense}</Text>
          <Text style={styles.subText}>顾客 {stats.customerCount}位</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  income: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
  },
  subRow: {
    flexDirection: 'row',
    gap: 16,
  },
  subText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  arrow: {
    fontSize: 20,
    color: '#C7C7CC',
    fontWeight: '300',
  },
});
