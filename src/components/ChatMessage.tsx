import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { ChatMessage as ChatMessageType } from '../types';

interface Props {
  message: ChatMessageType;
  onSuggestionPress?: (text: string) => void;
}

export function ChatMessage({ message, onSuggestionPress }: Props) {
  const isUser = message.role === 'user';
  
  // 高亮数字
  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\d+(?:\.\d+)?(?:元|块|位|个|瓶|种)?)/g).filter(part => part !== '');
    if (parts.length === 0) return null;
    return parts.map((part, i) => {
      if (/\d/.test(part)) {
        return <Text key={i} style={styles.highlightNum}>{part}</Text>;
      }
      return <Text key={i}>{part}</Text>;
    });
  };

  // 渲染可视化数据卡片
  const renderDataVisualization = () => {
    if (!message.data) return null;
    const { type, payload } = message.data;

    // 今日数据卡片
    if (type === 'query' && payload) {
      const net = (payload.totalIncome || 0) - (payload.totalExpense || 0);
      return (
        <View style={styles.dataCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>收入</Text>
              <Text style={styles.statValueBlue}>¥{payload.totalIncome || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>支出</Text>
              <Text style={styles.statValueRed}>¥{payload.totalExpense || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>净利</Text>
              <Text style={[styles.statValueGreen, net < 0 && styles.statValueRed]}>
                ¥{net}
              </Text>
            </View>
          </View>
          {payload.customerCount > 0 && (
            <View style={styles.customerRow}>
              <Text style={styles.customerText}>
                今日服务 <Text style={styles.customerNum}>{payload.customerCount}</Text> 位顾客
              </Text>
            </View>
          )}
        </View>
      );
    }

    // 月度图表
    if (type === 'chart' && payload) {
      const weekData = [0.5, 0.7, 0.4, 0.9, 0.6, 0.8, 0.55].map(r => r * (payload.avgDaily || 100));
      const maxValue = Math.max(...weekData, 1);
      
      return (
        <View style={styles.dataCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>总收入</Text>
              <Text style={styles.statValueBlue}>¥{payload.totalIncome || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>总支出</Text>
              <Text style={styles.statValueRed}>¥{payload.totalExpense || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>日均</Text>
              <Text style={styles.statValueBlue}>¥{payload.avgDaily || 0}</Text>
            </View>
          </View>
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>本周趋势</Text>
            <View style={styles.barChart}>
              {weekData.map((value, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={[styles.bar, { height: Math.max((value / maxValue) * 48, 4) }]} />
                  <Text style={styles.barLabel}>{['一', '二', '三', '四', '五', '六', '日'][i]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      );
    }

    // 库存列表
    if (type === 'inventory' && payload) {
      const items = Array.isArray(payload) ? payload : [payload];
      return (
        <View style={styles.dataCard}>
          {items.slice(0, 5).map((item: any, idx: number) => {
            const isLow = item.quantity <= item.alertThreshold;
            return (
              <View key={item.id || idx} style={styles.inventoryItem}>
                <View style={styles.inventoryLeft}>
                  <Text style={styles.inventoryName}>{item.name}</Text>
                  <View style={styles.progressWrap}>
                    <View style={[
                      styles.progressBar,
                      { width: `${Math.min((item.quantity / (item.alertThreshold * 3)) * 100, 100)}%` },
                      isLow && styles.progressLow
                    ]} />
                  </View>
                </View>
                <View style={styles.inventoryRight}>
                  <Text style={[styles.inventoryQty, isLow && styles.qtyLow]}>
                    {item.quantity}{item.unit}
                  </Text>
                  {isLow && <View style={styles.lowTag}><Text style={styles.lowTagText}>补货</Text></View>}
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    // 交易成功
    if (type === 'transaction' && payload) {
      const isIncome = payload.type === 'income';
      return (
        <View style={[styles.txCard, isIncome ? styles.txIncome : styles.txExpense]}>
          <View style={styles.txLeft}>
            <Text style={[styles.txAmount, isIncome ? styles.txAmountGreen : styles.txAmountRed]}>
              {isIncome ? '+' : '-'}¥{payload.amount}
            </Text>
            <Text style={styles.txLabel}>{payload.categoryLabel}</Text>
          </View>
          <View style={styles.txRight}>
            <Text style={[styles.txCheck, isIncome ? styles.txAmountGreen : styles.txAmountRed]}>✓</Text>
            {payload.todayTotal !== undefined && payload.todayTotal !== null && (
              <Text style={styles.txTotal}>今日 ¥{payload.todayTotal}</Text>
            )}
          </View>
        </View>
      );
    }

    // AI洞察
    if (type === 'insight' && payload) {
      const isWarn = payload.insightType === 'warning';
      return (
        <View style={[styles.insightCard, isWarn && styles.insightWarn]}>
          <View style={styles.insightHeader}>
            <View style={[styles.insightDot, isWarn && styles.insightDotWarn]} />
            <Text style={[styles.insightTitle, isWarn && styles.insightTitleWarn]}>
              {payload.title}
            </Text>
          </View>
          <Text style={styles.insightText}>{payload.content}</Text>
          {payload.stats && (
            <View style={styles.insightStats}>
              <View style={styles.insightStatItem}>
                <Text style={styles.insightStatNum}>{payload.stats.today?.customerCount || 0}</Text>
                <Text style={styles.insightStatLabel}>今日顾客</Text>
              </View>
              <View style={styles.insightStatItem}>
                <Text style={styles.insightStatNum}>¥{payload.stats.today?.totalIncome || 0}</Text>
                <Text style={styles.insightStatLabel}>今日收入</Text>
              </View>
              <View style={styles.insightStatItem}>
                <Text style={[styles.insightStatNum, payload.stats.lowStock > 0 && styles.insightStatWarn]}>
                  {payload.stats.lowStock || 0}
                </Text>
                <Text style={styles.insightStatLabel}>待补货</Text>
              </View>
            </View>
          )}
        </View>
      );
    }

    // 支付状态
    if (type === 'payment' && payload) {
      return (
        <View style={styles.paymentCard}>
          <View style={styles.paymentIcon}>
            <Text style={styles.paymentIconText}>{payload.source === 'alipay' ? '支' : '微'}</Text>
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>{payload.source === 'alipay' ? '支付宝' : '微信'}账单</Text>
            <Text style={styles.paymentStatus}>开发中</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  // 渲染推荐操作
  const renderSuggestions = () => {
    if (!message.suggestions || message.suggestions.length === 0 || isUser) return null;
    
    return (
      <View style={styles.suggestionsWrap}>
        {message.suggestions.map((s, i) => (
          <TouchableOpacity 
            key={i} 
            style={styles.suggestionBtn}
            onPress={() => onSuggestionPress?.(s)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {isUser ? message.content : (renderHighlightedText(message.content) || message.content)}
        </Text>
        {!isUser && renderDataVisualization()}
        {renderSuggestions()}
      </View>
      <Text style={styles.time}>{formatTime(new Date(message.timestamp))}</Text>
    </View>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '90%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    }),
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1D1D1F',
  },
  highlightNum: {
    color: '#007AFF',
    fontWeight: '600',
  },
  time: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 3,
    marginHorizontal: 4,
  },

  // 数据卡片
  dataCard: {
    marginTop: 10,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#86868B',
    marginBottom: 4,
  },
  statValueBlue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  statValueRed: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
  },
  statValueGreen: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  customerRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'center',
  },
  customerText: {
    fontSize: 12,
    color: '#86868B',
  },
  customerNum: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },

  // 图表
  chartBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  chartTitle: {
    fontSize: 11,
    color: '#86868B',
    marginBottom: 8,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 18,
    backgroundColor: '#007AFF',
    borderRadius: 3,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#86868B',
  },

  // 库存
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  inventoryLeft: {
    flex: 1,
    marginRight: 12,
  },
  inventoryName: {
    fontSize: 13,
    color: '#1D1D1F',
    fontWeight: '500',
    marginBottom: 4,
  },
  progressWrap: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  progressLow: {
    backgroundColor: '#FF9500',
  },
  inventoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inventoryQty: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  qtyLow: {
    color: '#FF9500',
  },
  lowTag: {
    backgroundColor: 'rgba(255,149,0,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowTagText: {
    fontSize: 10,
    color: '#FF9500',
    fontWeight: '600',
  },

  // 交易卡片
  txCard: {
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txIncome: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  txExpense: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  txLeft: {
    flex: 1,
  },
  txAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  txAmountGreen: {
    color: '#34C759',
  },
  txAmountRed: {
    color: '#FF3B30',
  },
  txLabel: {
    fontSize: 11,
    color: '#86868B',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txCheck: {
    fontSize: 16,
    fontWeight: '700',
  },
  txTotal: {
    fontSize: 11,
    color: '#86868B',
    marginTop: 2,
  },

  // 洞察卡片
  insightCard: {
    marginTop: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.06)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  insightWarn: {
    backgroundColor: 'rgba(255, 149, 0, 0.06)',
    borderLeftColor: '#FF9500',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginRight: 6,
  },
  insightDotWarn: {
    backgroundColor: '#FF9500',
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  insightTitleWarn: {
    color: '#FF9500',
  },
  insightText: {
    fontSize: 13,
    color: '#1D1D1F',
    lineHeight: 18,
  },
  insightStats: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  insightStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightStatNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  insightStatWarn: {
    color: '#FF9500',
  },
  insightStatLabel: {
    fontSize: 10,
    color: '#86868B',
    marginTop: 2,
  },

  // 支付卡片
  paymentCard: {
    marginTop: 10,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  paymentIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  paymentStatus: {
    fontSize: 11,
    color: '#86868B',
    marginTop: 1,
  },

  // 推荐操作按钮
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  suggestionBtn: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  suggestionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});
