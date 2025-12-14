import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text,
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Keyboard,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { VoiceOverlay } from './VoiceOverlay';

interface Props {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

const QUICK_ACTIONS = [
  // 核心记账
  { label: '记一笔', msg: '记一笔收入' },
  { label: '今日账', msg: '今日收入支出' },
  { label: '本月账', msg: '本月收支统计' },
  // 库存管理
  { label: '看库存', msg: '库存明细' },
  { label: '补货', msg: '哪些商品需要补货' },
  // 数据分析
  { label: '分析', msg: '帮我分析经营情况' },
  { label: '客单价', msg: '今日客单价多少' },
  // 支出管理
  { label: '记支出', msg: '记一笔支出' },
  { label: '进货', msg: '记录进货支出' },
  // 便捷操作  
  { label: '清账', msg: '账户清零' },
  { label: '导出', msg: '导出账目数据' },
];

export function ChatInput({ onSend, isLoading }: Props) {
  const [text, setText] = useState('');
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
      Keyboard.dismiss();
    }
  };

  const handleQuickAction = (msg: string) => {
    if (!isLoading) {
      onSend(msg);
    }
  };

  const requestMicPermission = async () => {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (err: any) {
        console.log('麦克风不可用');
        return false;
      }
    }
    return true;
  };

  const startRecognition = useCallback(async () => {
    if (Platform.OS !== 'web') {
      setTranscript('暂不支持该平台语音');
      return;
    }

    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setTranscript('浏览器不支持语音');
      setIsListening(false);
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recog = new SpeechRecognition();
    recog.lang = 'zh-CN';
    recog.interimResults = true;
    recog.continuous = false;
    recog.maxAlternatives = 1;

    let finalText = '';

    recog.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recog.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText = result[0].transcript;
        } else {
          interim = result[0].transcript;
        }
      }
      setTranscript(finalText || interim);
    };

    recog.onend = () => {
      setIsListening(false);
      if (finalText.trim()) {
        setTimeout(() => {
          onSend(finalText.trim());
          setVoiceVisible(false);
          setTranscript('');
        }, 500);
      } else {
        setVoiceVisible(false);
        setTranscript('');
      }
    };

    recog.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setTranscript('请允许麦克风权限');
      } else {
        setTranscript('识别失败，请重试');
      }
    };

    try {
      recog.start();
      recognitionRef.current = recog;
    } catch (e) {
      setTranscript('启动失败');
      setIsListening(false);
    }
  }, [onSend]);

  const startVoice = useCallback(async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      Alert.alert('需要麦克风权限', '请在浏览器允许麦克风权限');
      return;
    }
    setVoiceVisible(true);
    setTranscript('');
    setTimeout(() => startRecognition(), 300);
  }, [startRecognition]);

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setVoiceVisible(false);
    setTranscript('');
  }, []);

  // 长按开始语音
  const handleLongPressStart = useCallback(async () => {
    isLongPressing.current = true;
    longPressTimer.current = setTimeout(async () => {
      if (isLongPressing.current) {
        await startVoice();
      }
    }, 300);
  }, [startVoice]);

  // 松开结束语音
  const handleLongPressEnd = useCallback(() => {
    isLongPressing.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isListening) {
      stopVoice();
    }
  }, [isListening, stopVoice]);

  const renderInput = () => {
    if (Platform.OS === 'web') {
      return (
        <input
          data-chat-input="true"
          style={{
            flex: 1,
            fontSize: 16,
            color: '#000000',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '12px 16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="发消息或按住说话..."
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
        />
      );
    }

    return (
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="发消息或按住说话..."
        placeholderTextColor="#8E8E93"
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        editable={!isLoading}
        blurOnSubmit={false}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* 独立菜单栏 - 豆包风格 */}
      <View style={styles.menuBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}
        >
          {QUICK_ACTIONS.map((item, idx) => (
            <TouchableOpacity 
              key={idx}
              style={styles.menuItem} 
              onPress={() => handleQuickAction(item.msg)} 
              activeOpacity={0.6}
            >
              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 输入框 - 独立设计 */}
      <View style={styles.inputWrapper}>
        {renderInput()}
        {text.trim() && (
          <TouchableOpacity 
            style={styles.sendBtn}
            onPress={handleSend}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.sendText}>发送</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <VoiceOverlay
        visible={voiceVisible}
        isListening={isListening}
        transcript={transcript}
        onClose={stopVoice}
        onRetry={startRecognition}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    paddingTop: 8,
    paddingBottom: 8,
  },
  // 独立菜单栏
  menuBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  menuContent: {
    flexDirection: 'row',
    gap: 8,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  // 输入框
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 12,
  },
  sendBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
