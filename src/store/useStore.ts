import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Transaction, 
  InventoryItem, 
  Customer, 
  ChatMessage, 
  ShopInfo,
  DailyStats,
  PaymentMethod,
  ServiceCategory
} from '../types';

interface AppState {
  // 店铺信息
  shopInfo: ShopInfo;
  setShopInfo: (info: Partial<ShopInfo>) => void;

  // 交易记录
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;

  // 库存
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  clearInventory: () => void;

  // 顾客
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalSpent' | 'visitCount'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  clearCustomers: () => void;

  // 聊天记录
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // 清空所有数据
  clearAllData: () => void;

  // 统计方法
  getTodayStats: () => DailyStats;
  getMonthStats: (year: number, month: number) => {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
  };
}

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// 检查是否是今天
const isToday = (date: Date) => {
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

// 检查是否是指定月份
const isInMonth = (date: Date, year: number, month: number) => {
  const d = new Date(date);
  return d.getFullYear() === year && d.getMonth() === month;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 店铺信息
      shopInfo: {
        name: '我的理发店',
        wechatPayEnabled: true,
        alipayEnabled: true,
      },
      setShopInfo: (info) => set((state) => ({
        shopInfo: { ...state.shopInfo, ...info }
      })),

      // 交易记录
      transactions: [],
      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({
          transactions: [newTransaction, ...state.transactions]
        }));
        return newTransaction;
      },
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      })),
      clearTransactions: () => set({ transactions: [] }),

      // 库存
      inventory: [
        { id: '1', name: '洗发水', quantity: 5, unit: '瓶', alertThreshold: 3 },
        { id: '2', name: '护发素', quantity: 8, unit: '瓶', alertThreshold: 3 },
        { id: '3', name: '染发膏', quantity: 12, unit: '盒', alertThreshold: 5 },
        { id: '4', name: '烫发药水', quantity: 6, unit: '套', alertThreshold: 3 },
      ],
      addInventoryItem: (item) => set((state) => ({
        inventory: [...state.inventory, { ...item, id: generateId() }]
      })),
      updateInventoryItem: (id, updates) => set((state) => ({
        inventory: state.inventory.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      })),
      deleteInventoryItem: (id) => set((state) => ({
        inventory: state.inventory.filter(item => item.id !== id)
      })),
      clearInventory: () => set({ inventory: [] }),

      // 顾客
      customers: [],
      addCustomer: (customer) => set((state) => ({
        customers: [...state.customers, {
          ...customer,
          id: generateId(),
          totalSpent: 0,
          visitCount: 0,
          createdAt: new Date(),
        }]
      })),
      updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map(c => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),
      clearCustomers: () => set({ customers: [] }),

      // 聊天记录
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '嗨！我是小账，你的AI记账助手',
          timestamp: new Date(),
          suggestions: ['记一笔', '今日收入', '查库存', '帮我分析'],
        }
      ],
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        }]
      })),
      clearMessages: () => set({
        messages: [{
          id: 'welcome',
          role: 'assistant',
          content: '好的，聊天记录已清空，咱们重新开始聊吧~',
          timestamp: new Date(),
          suggestions: ['记一笔', '今日收入', '查库存', '帮我分析'],
        }]
      }),

      // 清空所有账目数据（账户清零）
      clearAllData: () => set((state) => ({
        transactions: [],
        customers: [],
        messages: [{
          id: 'welcome',
          role: 'assistant',
          content: '账户已清零！所有交易记录和顾客数据都已删除，咱们从头开始记账吧～有什么需要帮忙的随时说！',
          timestamp: new Date(),
          suggestions: ['记第一笔收入', '添加库存', '设置店铺信息'],
        }]
      })),

      // 统计方法
      getTodayStats: () => {
        const transactions = get().transactions;
        const todayTransactions = transactions.filter(t => isToday(new Date(t.createdAt)));
        
        const incomeTransactions = todayTransactions.filter(t => t.type === 'income');
        const expenseTransactions = todayTransactions.filter(t => t.type === 'expense');
        
        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        // 统计最热门服务
        const serviceCounts: Record<string, number> = {};
        incomeTransactions.forEach(t => {
          serviceCounts[t.categoryLabel] = (serviceCounts[t.categoryLabel] || 0) + 1;
        });
        const topService = Object.entries(serviceCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        return {
          totalIncome,
          totalExpense,
          transactionCount: todayTransactions.length,
          customerCount: incomeTransactions.length,
          topService,
        };
      },

      getMonthStats: (year, month) => {
        const transactions = get().transactions;
        const monthTransactions = transactions.filter(t => 
          isInMonth(new Date(t.createdAt), year, month)
        );
        
        const totalIncome = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          totalIncome,
          totalExpense,
          netProfit: totalIncome - totalExpense,
        };
      },
    }),
    {
      name: 'zhangzhanggui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        shopInfo: state.shopInfo,
        transactions: state.transactions,
        inventory: state.inventory,
        customers: state.customers,
        messages: state.messages.slice(-50), // 只保存最近50条消息
      }),
    }
  )
);

