import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { JarvisOrb } from './JarvisOrb';

interface Props {
  visible: boolean;
  isListening: boolean;
  transcript: string;
  onClose: () => void;
  onRetry?: () => void;
}

/**
 * 语音输入全屏覆盖层 - 贾维斯风格
 */
export function VoiceOverlay({ visible, isListening, transcript, onClose, onRetry }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* 贾维斯动效球 - 始终显示 */}
          <View style={styles.orbContainer}>
            <JarvisOrb isActive={isListening} size={140} />
            {!isListening && (
              <View style={styles.staticOrb}>
                <View style={styles.staticOrbInner} />
              </View>
            )}
          </View>

          {/* 状态文字 */}
          <Text style={styles.statusText}>
            {isListening ? '正在聆听...' : '点击下方重试'}
          </Text>

          {/* 实时转写 */}
          {transcript ? (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
          ) : (
            <Text style={styles.hintText}>
              {isListening ? '请说出您的需求' : '没有检测到语音'}
            </Text>
          )}

          {/* 能力提示 */}
          <View style={styles.capabilities}>
            <Text style={styles.capTitle}>AI 可以帮您</Text>
            <View style={styles.capGrid}>
              <View style={styles.capItem}>
                <Text style={styles.capText}>记账收支</Text>
              </View>
              <View style={styles.capItem}>
                <Text style={styles.capText}>查询统计</Text>
              </View>
              <View style={styles.capItem}>
                <Text style={styles.capText}>库存管理</Text>
              </View>
              <View style={styles.capItem}>
                <Text style={styles.capText}>经营分析</Text>
              </View>
              <View style={styles.capItem}>
                <Text style={styles.capText}>日常闲聊</Text>
              </View>
              <View style={styles.capItem}>
                <Text style={styles.capText}>任何问题</Text>
              </View>
            </View>
          </View>

          {/* 底部操作 */}
          <View style={styles.bottomActions}>
            {!isListening && onRetry && (
              <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                <Text style={styles.retryText}>重新录音</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  orbContainer: {
    width: 350,
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticOrb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 60px rgba(0,122,255,0.3)',
    } : {
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 30,
    }),
  },
  staticOrbInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.4)',
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 16,
  },
  transcriptBox: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 18,
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.25)',
    maxWidth: '95%',
  },
  transcriptText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  capabilities: {
    marginTop: 48,
    alignItems: 'center',
  },
  capTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  capGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    maxWidth: 300,
  },
  capItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  capText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 16,
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#007AFF',
    borderRadius: 25,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
