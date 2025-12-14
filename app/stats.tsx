import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { InsightCard } from '../src/components/InsightCard';
import { DataChart } from '../src/components/DataChart';

type TimeRange = 'today' | 'week' | 'month';

// 小圆点指示器
const Dot = ({ color }: { color: string }) => (
  <View style={[styles.dot, { backgroundColor: color }]} />
);

export default function StatsScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const { transactions, inventory, clearTransactions, clearAllData } = useStore();

  const handleClearTransactions = () => {
    Alert.alert(
      '清空交易记录',
      '确定要删除所有交易记录吗？此操作不可撤销！',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确认删除', 
          style: 'destructive', 
          onPress: () => {
            clearTransactions();
            Alert.alert('已清空', '所有交易记录已删除');
          }
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      '账户清零',
      '这将删除所有交易记录和顾客数据，确定要继续吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确认清零', 
          style: 'destructive', 
          onPress: () => {
            clearAllData();
            Alert.alert('账户已清零', '所有数据已删除，从头开始记账吧！');
          }
        },
      ]
    );
  };

  const todayTransactions = useMemo(() => {
    const today = new Date().toDateString();
    return transactions.filter(t => new Date(t.createdAt).toDateString() === today);
  }, [transactions]);

  const stats = useMemo(() => {
    let filteredTx = transactions;
    const now = new Date();
    
    if (timeRange === 'today') {
      filteredTx = todayTransactions;
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTx = transactions.filter(t => new Date(t.createdAt) >= weekAgo);
    } else {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredTx = transactions.filter(t => new Date(t.createdAt) >= monthAgo);
    }

    const income = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const customers = new Set(filteredTx.filter(t => t.customerId).map(t => t.customerId)).size || 
                      filteredTx.filter(t => t.type === 'income').length;

    return { income, expense, customers };
  }, [transactions, timeRange, todayTransactions]);

  const profit = stats.income - stats.expense;

  const weekData = useMemo(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days.map((label, i) => ({
      label,
      value: Math.floor(Math.random() * 500 + 200),
    }));
  }, []);

  const generateInsights = () => {
    const insights = [];
    if (stats.income > 0) {
      insights.push({
        type: 'tip' as const,
        title: '收入情况',
        content: `${timeRange === 'today' ? '今日' : timeRange === 'week' ? '本周' : '本月'}收入¥${stats.income}，${stats.income > 500 ? '表现不错！' : '继续加油~'}`,
      });
    }
    const lowStock = inventory.filter(i => i.quantity <= i.alertThreshold);
    if (lowStock.length > 0) {
      insights.push({
        type: 'warning' as const,
        title: '库存预警',
        content: `${lowStock.map(i => i.name).join('、')}库存偏低，建议补货`,
      });
    }
    if (insights.length === 0) {
      insights.push({
        type: 'tip' as const,
        title: '开始记账',
        content: '对AI说"收了38块"开始记录第一笔账',
      });
    }
    return insights;
  };

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>数据统计</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 时间选择 */}
        <View style={styles.segmentWrap}>
          <View style={styles.segment}>
            {(['today', 'week', 'month'] as TimeRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.segmentBtn, timeRange === range && styles.segmentBtnActive]}
                onPress={() => setTimeRange(range)}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, timeRange === range && styles.segmentTextActive]}>
                  {range === 'today' ? '今日' : range === 'week' ? '本周' : '本月'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 核心数据卡片 */}
        <View style={styles.card}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>收入</Text>
              <Text style={styles.statValueBlue}>¥{stats.income}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>支出</Text>
              <Text style={styles.statValue}>¥{stats.expense}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>净利润</Text>
              <Text style={[styles.statValueBlue, profit < 0 && styles.statValueRed]}>¥{profit}</Text>
            </View>
          </View>
        </View>

        {/* 指标卡片 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>顾客数</Text>
            <Text style={styles.rowValue}>{stats.customers}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>客单价</Text>
            <Text style={styles.rowValue}>¥{stats.customers > 0 ? Math.round(stats.income / stats.customers) : 0}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>交易笔数</Text>
            <Text style={styles.rowValue}>{todayTransactions.length}</Text>
          </View>
        </View>

        {/* AI洞察 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI 智能洞察</Text>
        </View>
        <View style={styles.insightsWrap}>
          {generateInsights().map((insight, index) => (
            <InsightCard key={index} type={insight.type} title={insight.title} content={insight.content} />
          ))}
        </View>

        {/* 图表区域 */}
        {timeRange !== 'today' && (
          <View style={styles.chartWrap}>
            <DataChart title="收入趋势" data={weekData} type="bar" height={180} />
          </View>
        )}

        {/* 最近交易 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近交易</Text>
          <TouchableOpacity><Text style={styles.sectionMore}>查看全部</Text></TouchableOpacity>
        </View>
        
        {todayTransactions.length > 0 ? (
          <View style={styles.card}>
            {todayTransactions.slice(0, 5).map((t, idx) => (
              <View key={t.id}>
                <View style={styles.txRow}>
                  <Dot color={t.type === 'income' ? '#34C759' : '#FF3B30'} />
                  <View style={styles.txInfo}>
                    <Text style={styles.txName}>{t.categoryLabel}</Text>
                    <Text style={styles.txTime}>
                      {new Date(t.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, t.type === 'income' ? styles.txGreen : styles.txRed]}>
                    {t.type === 'income' ? '+' : '-'}¥{t.amount}
                  </Text>
                </View>
                {idx < Math.min(todayTransactions.length, 5) - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.empty}>
              <Text style={styles.emptyText}>暂无交易记录</Text>
              <Text style={styles.emptySub}>对AI说"收了38块"开始记账</Text>
            </View>
          </View>
        )}

        {/* 库存状态 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>库存状态</Text>
        </View>
        <View style={styles.card}>
          {inventory.length > 0 ? inventory.slice(0, 4).map((item, idx) => (
            <View key={item.id}>
              <View style={styles.row}>
                <Dot color={item.quantity <= item.alertThreshold ? '#FF9500' : '#007AFF'} />
                <Text style={styles.rowLabel}>{item.name}</Text>
                <View style={styles.stockRight}>
                  <Text style={[styles.rowValue, item.quantity <= item.alertThreshold && styles.textOrange]}>
                    {item.quantity}{item.unit}
                  </Text>
                  {item.quantity <= item.alertThreshold && <Text style={styles.stockTag}>偏低</Text>}
                </View>
              </View>
              {idx < Math.min(inventory.length, 4) - 1 && <View style={styles.divider} />}
            </View>
          )) : (
            <View style={styles.emptySmall}>
              <Text style={styles.emptyText}>暂无库存记录</Text>
            </View>
          )}
        </View>

        {/* 数据管理 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>数据管理</Text>
        </View>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleClearTransactions} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>清空交易记录</Text>
            <Text style={styles.rowValueDanger}>{transactions.length}条</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleClearAllData} activeOpacity={0.6}>
            <Text style={styles.rowLabelDanger}>账户清零</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 12,
    paddingBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F2F2F7',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#007AFF',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  segmentWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#007AFF',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  segmentTextActive: {
    color: '#fff',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  statValueBlue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
  },
  statValueRed: {
    color: '#FF3B30',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  rowValue: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 6,
  },
  rowValueDanger: {
    fontSize: 16,
    color: '#FF3B30',
    marginRight: 6,
  },
  rowLabelDanger: {
    flex: 1,
    fontSize: 16,
    color: '#FF3B30',
  },
  arrow: {
    fontSize: 18,
    color: '#C7C7CC',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  sectionMore: {
    fontSize: 14,
    color: '#007AFF',
  },
  insightsWrap: {
    marginHorizontal: 16,
    gap: 10,
  },
  chartWrap: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  txInfo: {
    flex: 1,
  },
  txName: {
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  txTime: {
    fontSize: 13,
    color: '#8E8E93',
  },
  txAmount: {
    fontSize: 17,
    fontWeight: '600',
  },
  txGreen: {
    color: '#34C759',
  },
  txRed: {
    color: '#FF3B30',
  },
  stockRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockTag: {
    fontSize: 11,
    color: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    overflow: 'hidden',
  },
  textOrange: {
    color: '#FF9500',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySmall: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptySub: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    opacity: 0.7,
  },
});
