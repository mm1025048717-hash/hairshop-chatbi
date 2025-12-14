import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { Colors } from '../theme/colors';

type Props = {
  title?: string;
  days?: number;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function ChartBubble({ title = '近7天趋势', days = 7 }: Props) {
  const { transactions } = useStore();

  const data = useMemo(() => {
    const now = startOfDay(new Date());
    const labels: string[] = [];
    const income: number[] = [];
    const expense: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);

      const dayIncome = transactions
        .filter(t => t.type === 'income')
        .filter(t => {
          const dt = new Date(t.createdAt);
          return dt >= day && dt < next;
        })
        .reduce((s, t) => s + t.amount, 0);

      const dayExpense = transactions
        .filter(t => t.type === 'expense')
        .filter(t => {
          const dt = new Date(t.createdAt);
          return dt >= day && dt < next;
        })
        .reduce((s, t) => s + t.amount, 0);

      labels.push(`${day.getMonth() + 1}/${day.getDate()}`);
      income.push(dayIncome);
      expense.push(dayExpense);
    }

    const max = Math.max(1, ...income, ...expense);
    return { labels, income, expense, max };
  }, [transactions, days]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.blue }]} />
          <Text style={styles.legendText}>收入</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#9CA3AF' }]} />
          <Text style={styles.legendText}>支出</Text>
        </View>
      </View>

      <View style={styles.chart}>
        {data.labels.map((lb, idx) => {
          const hIncome = Math.round((data.income[idx] / data.max) * 54);
          const hExpense = Math.round((data.expense[idx] / data.max) * 54);
          return (
            <View key={lb} style={styles.col}>
              <View style={styles.bars}>
                <View style={[styles.bar, { height: hExpense, backgroundColor: '#9CA3AF' }]} />
                <View style={[styles.bar, { height: hIncome, backgroundColor: Colors.blue }]} />
              </View>
              <Text style={styles.xLabel}>{lb}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.subtext,
    fontSize: 12,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  col: {
    width: 34,
    alignItems: 'center',
  },
  bars: {
    height: 56,
    width: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bar: {
    width: 12,
    borderRadius: 6,
  },
  xLabel: {
    marginTop: 6,
    fontSize: 10,
    color: Colors.subtext,
  },
});


