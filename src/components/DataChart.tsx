import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  title: string;
  data: ChartData[];
  type?: 'bar' | 'pie' | 'line';
  height?: number;
}

/**
 * 简单的数据图表组件
 * 纯React Native实现，无需第三方库
 */
export function DataChart({ title, data, type = 'bar', height = 200 }: Props) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // 条形图
  if (type === 'bar') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.chartArea, { height }]}>
          <View style={styles.barContainer}>
            {data.map((item, index) => {
              const barHeight = (item.value / maxValue) * (height - 40);
              return (
                <View key={index} style={styles.barItem}>
                  <Text style={styles.barValue}>¥{item.value}</Text>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: barHeight,
                        backgroundColor: item.color || Colors.blue,
                      }
                    ]} 
                  />
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  // 饼图（简化版-显示为比例条）
  if (type === 'pie') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.pieContainer}>
          <View style={styles.pieBar}>
            {data.map((item, index) => {
              const width = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <View
                  key={index}
                  style={[
                    styles.pieSegment,
                    {
                      width: `${width}%`,
                      backgroundColor: item.color || getColor(index),
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.legend}>
            {data.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color || getColor(index) }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendValue}>¥{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // 折线图（简化版-显示为趋势点）
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.lineContainer, { height }]}>
        <View style={styles.lineChart}>
          {data.map((item, index) => {
            const dotY = ((maxValue - item.value) / maxValue) * (height - 60);
            return (
              <View key={index} style={styles.linePoint}>
                <View style={[styles.lineDot, { marginTop: dotY }]}>
                  <Text style={styles.dotValue}>¥{item.value}</Text>
                </View>
                <Text style={styles.lineLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE'];
const getColor = (index: number) => COLORS[index % COLORS.length];

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  chartArea: {
    justifyContent: 'flex-end',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 32,
    borderRadius: 6,
    marginVertical: 8,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  barLabel: {
    fontSize: 12,
    color: Colors.subtext,
  },
  pieContainer: {
    gap: 16,
  },
  pieBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  pieSegment: {
    height: '100%',
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.blue,
  },
  lineContainer: {
    justifyContent: 'center',
  },
  lineChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 24,
  },
  linePoint: {
    alignItems: 'center',
    flex: 1,
  },
  lineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blueSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.blue,
  },
  dotValue: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.blue,
  },
  lineLabel: {
    fontSize: 11,
    color: Colors.subtext,
    marginTop: 8,
    position: 'absolute',
    bottom: -20,
  },
});


