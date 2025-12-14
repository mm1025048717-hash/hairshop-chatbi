import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { ChatMessage } from '../src/components/ChatMessage';
import { ChatInput } from '../src/components/ChatInput';
import { StatsCard } from '../src/components/StatsCard';
import { chatAgent, ChatSession } from '../src/services/chatAgent';
import { ChatMessage as ChatMessageType } from '../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const prevMessageCount = useRef(0);
  
  const { messages, addMessage, clearMessages, getTodayStats } = useStore();
  const todayStats = getTodayStats();

  useEffect(() => {
    chatAgent.initialize();
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const list = await chatAgent.getSessions();
    setSessions(list);
  };

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      setShouldScrollToEnd(true);
      prevMessageCount.current = messages.length;
    }
  }, [messages.length]);

  const handleContentSizeChange = useCallback(() => {
    if (shouldScrollToEnd) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
        setShouldScrollToEnd(false);
      }, 100);
    }
  }, [shouldScrollToEnd]);

  const handleClearChat = useCallback(() => {
    if (Platform.OS === 'web') {
      // Web平台直接确认
      const w = typeof window !== 'undefined' ? window : null;
      if (w && w.confirm('确定要清空当前对话吗？')) {
        chatAgent.clearHistory().then(() => {
          clearMessages();
          prevMessageCount.current = 1;
          setShouldScrollToEnd(true);
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
          }, 100);
        }).catch((error) => {
          console.error('清空失败:', error);
          if (w) w.alert('清空失败，请重试');
        });
      }
    } else {
      // 移动端使用Alert
      Alert.alert(
        '清空聊天', 
        '确定要清空当前对话吗？', 
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '清空', 
            style: 'destructive',
            onPress: async () => {
              try {
                await chatAgent.clearHistory();
                clearMessages();
                prevMessageCount.current = 1;
                setShouldScrollToEnd(true);
                setTimeout(() => {
                  flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
                }, 100);
              } catch (error) {
                console.error('清空失败:', error);
                Alert.alert('错误', '清空失败，请重试');
              }
            }
          },
        ],
        { cancelable: true }
      );
    }
  }, [clearMessages]);

  const handleNewChat = useCallback(async () => {
    // 保存当前会话
    if (messages.length > 1) {
      await chatAgent.saveSession();
      await loadSessions();
    }
    
    // 开始新会话
    await chatAgent.startNewSession();
    clearMessages();
    prevMessageCount.current = 1;
    setShowSessions(false);
  }, [messages.length, clearMessages]);

  const handleLoadSession = useCallback(async (sessionId: string) => {
    const success = await chatAgent.loadSession(sessionId);
    if (success) {
      // 重新加载消息到store（这里简化处理，实际可能需要更复杂的逻辑）
      setShowSessions(false);
      Alert.alert('提示', '会话已加载，刷新页面查看');
    }
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    Alert.alert('删除会话', '确定删除此会话？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await chatAgent.deleteSession(sessionId);
          await loadSessions();
        }
      }
    ]);
  }, []);

  const handleAIAction = useCallback(async (action: any) => {
    if (!action) return;
    
    if (action.action === 'clear_chat') {
      await chatAgent.clearHistory();
      clearMessages();
      prevMessageCount.current = 1;
      setShouldScrollToEnd(true);
    } else if (action.action === 'clear_all') {
      // 账户清零已经在store中处理了，这里只需要刷新UI
      clearMessages(); // store.clearAllData()已经重置了messages
      await chatAgent.clearHistory();
      prevMessageCount.current = 1;
      setShouldScrollToEnd(true);
    } else if (action.action === 'navigate') {
      if (action.page === 'stats') {
        router.push('/stats');
      } else if (action.page === 'settings') {
        router.push('/settings');
      }
    }
  }, [clearMessages, router]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    addMessage({ role: 'user', content: text });
    setIsLoading(true);

    try {
      const response = await chatAgent.processMessage(text);
      
      addMessage({
        role: 'assistant',
        content: response.message,
        data: response.data,
        suggestions: response.suggestions,
      });

      if (response.data?.type === 'action') {
        handleAIAction(response.data.payload);
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage({
        role: 'assistant',
        content: '网络问题，稍后重试',
        suggestions: ['重试', '记一笔', '今日收入'],
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, handleAIAction, isLoading]);

  // 处理推荐按钮点击
  const handleSuggestionPress = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  const renderMessage = useCallback(({ item }: { item: ChatMessageType }) => (
    <ChatMessage 
      message={item} 
      onSuggestionPress={handleSuggestionPress}
    />
  ), [handleSuggestionPress]);

  const keyExtractor = useCallback((item: ChatMessageType) => item.id, []);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 简洁顶部栏 */}
      <View style={styles.header}>
        <Text style={styles.title}>账掌柜</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleNewChat} style={styles.newBtn} activeOpacity={0.7}>
            <Text style={styles.newBtnText}>+ 新对话</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleClearChat}
            style={styles.clearBtn} 
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.clearBtnText}>清空</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 今日卡片 */}
      <StatsCard stats={todayStats} onPress={() => router.push('/stats')} />
      
      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        style={styles.messageList}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={true}
        onContentSizeChange={handleContentSizeChange}
      />

      {/* 加载指示器 */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>思考中...</Text>
        </View>
      )}
      
      {/* 输入区 */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />

      {/* 底部TabBar - 纯文字无icon */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.tabLabelActive}>对话</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/stats')} activeOpacity={0.7}>
          <Text style={styles.tabLabel}>统计</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setShowSessions(true)} activeOpacity={0.7}>
          <Text style={styles.tabLabel}>历史</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/settings')} activeOpacity={0.7}>
          <Text style={styles.tabLabel}>设置</Text>
        </TouchableOpacity>
      </View>

      {/* 历史会话弹窗 */}
      <Modal
        visible={showSessions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSessions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>历史会话</Text>
              <TouchableOpacity onPress={() => setShowSessions(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.newSessionBtn} onPress={handleNewChat}>
              <Text style={styles.newSessionText}>+ 开始新对话</Text>
            </TouchableOpacity>
            
            <ScrollView style={styles.sessionList}>
              {sessions.length === 0 ? (
                <Text style={styles.emptyText}>暂无历史会话</Text>
              ) : (
                sessions.map((session) => (
                  <View key={session.id} style={styles.sessionItem}>
                    <TouchableOpacity 
                      style={styles.sessionInfo}
                      onPress={() => handleLoadSession(session.id)}
                    >
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      <Text style={styles.sessionMeta}>
                        {session.messageCount}条消息 · {new Date(session.lastMessageAt).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteSession(session.id)}
                    >
                      <Text style={styles.deleteBtnText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#007AFF',
  },
  newBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    minWidth: 60,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  // 底部TabBar - 简洁纯文字
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  tabLabelActive: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 10,
    paddingBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  loadingText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },

  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  modalClose: {
    fontSize: 24,
    color: '#8E8E93',
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
  },
  newSessionBtn: {
    margin: 16,
    padding: 14,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  newSessionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionList: {
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 15,
    paddingVertical: 50,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 3,
  },
  sessionMeta: {
    fontSize: 13,
    color: '#8E8E93',
  },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
  },
});
