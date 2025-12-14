import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/useStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { shopInfo, setShopInfo, clearMessages, transactions } = useStore();
  const [editModal, setEditModal] = useState<{ field: string; title: string; value: string } | null>(null);
  const [inputValue, setInputValue] = useState('');

  const openEdit = (field: string, title: string, currentValue: string) => {
    setEditModal({ field, title, value: currentValue });
    setInputValue(currentValue || '');
  };

  const saveEdit = () => {
    if (editModal) {
      setShopInfo({ [editModal.field]: inputValue });
      setEditModal(null);
      Alert.alert('已保存', `${editModal.title}已更新`);
    }
  };

  const handleClearChat = () => {
    Alert.alert('清除聊天记录', '确定要清除所有聊天记录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '清除', style: 'destructive', onPress: () => { clearMessages(); Alert.alert('已清除'); } },
    ]);
  };

  const handleExport = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    Alert.alert('账目数据', `共 ${transactions.length} 条\n收入：¥${totalIncome}\n支出：¥${totalExpense}`);
  };

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 店铺信息 */}
        <Text style={styles.sectionTitle}>店铺信息</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.row} 
            onPress={() => openEdit('name', '店铺名称', shopInfo.name)}
            activeOpacity={0.6}
          >
            <Text style={styles.rowLabel}>店铺名称</Text>
            <Text style={styles.rowValue}>{shopInfo.name || '点击设置'}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.row} 
            onPress={() => openEdit('address', '店铺地址', shopInfo.address || '')}
            activeOpacity={0.6}
          >
            <Text style={styles.rowLabel}>店铺地址</Text>
            <Text style={styles.rowValue}>{shopInfo.address || '点击设置'}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.row} 
            onPress={() => openEdit('phone', '联系电话', shopInfo.phone || '')}
            activeOpacity={0.6}
          >
            <Text style={styles.rowLabel}>联系电话</Text>
            <Text style={styles.rowValue}>{shopInfo.phone || '点击设置'}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 支付设置 */}
        <Text style={styles.sectionTitle}>支付设置</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>微信支付</Text>
            <Switch
              value={shopInfo.wechatPayEnabled}
              onValueChange={(value) => setShopInfo({ wechatPayEnabled: value })}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>支付宝</Text>
            <Switch
              value={shopInfo.alipayEnabled}
              onValueChange={(value) => setShopInfo({ alipayEnabled: value })}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* 通用设置 */}
        <Text style={styles.sectionTitle}>通用设置</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>语音播报</Text>
            <Switch
              value={shopInfo.voiceEnabled || false}
              onValueChange={(value) => setShopInfo({ voiceEnabled: value })}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* 数据管理 */}
        <Text style={styles.sectionTitle}>数据管理</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleExport} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>导出数据</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.row} onPress={handleClearChat} activeOpacity={0.6}>
            <Text style={styles.rowLabelDanger}>清除聊天记录</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 关于 */}
        <Text style={styles.sectionTitle}>关于</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert('帮助', '有问题可以直接问AI助手')} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>帮助与反馈</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>版本</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </View>

        {/* 底部信息 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>账掌柜 · AI智能记账助手</Text>
          <Text style={styles.footerSub}>由 DeepSeek 大模型提供支持</Text>
        </View>
      </ScrollView>

      {/* 编辑弹窗 */}
      <Modal visible={!!editModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editModal?.title}</Text>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={`请输入${editModal?.title}`}
              placeholderTextColor="#999"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setEditModal(null)}>
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={saveEdit}>
                <Text style={styles.modalBtnSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
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
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  rowLabelDanger: {
    flex: 1,
    fontSize: 16,
    color: '#FF3B30',
  },
  rowValue: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 6,
  },
  arrow: {
    fontSize: 18,
    color: '#C7C7CC',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 60,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  footerSub: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F2F2F7',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
  },
  modalBtnCancelText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalBtnSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  modalBtnSaveText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
