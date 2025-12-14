// 交易类型
export type TransactionType = 'income' | 'expense';

// 支付方式
export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'card';

// 服务项目分类
export type ServiceCategory = 
  | 'haircut'      // 剪发
  | 'wash_cut'     // 洗剪
  | 'wash_cut_blow' // 洗剪吹
  | 'perm'         // 烫发
  | 'dye'          // 染发
  | 'care'         // 护理
  | 'other';       // 其他

// 交易记录
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: ServiceCategory | string;
  categoryLabel: string;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  staffName?: string;
  note?: string;
  createdAt: Date;
}

// 库存商品
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  alertThreshold: number;
  supplier?: string;
  supplierPhone?: string;
  lastRestockDate?: Date;
  price?: number;
}

// 会员/顾客
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  gender?: 'male' | 'female';
  totalSpent: number;
  visitCount: number;
  lastVisit?: Date;
  preferences?: string;
  birthday?: string;
  createdAt: Date;
}

// 对话消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: {
    type: 'transaction' | 'query' | 'inventory' | 'chart' | 'insight' | 'payment' | 'action';
    payload?: any;
  };
  suggestions?: string[];
}

// 今日统计
export interface DailyStats {
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  customerCount: number;
  topService?: string;
}

// 月度统计
export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  transactionCount: number;
  avgDailyIncome: number;
  growthRate?: number;
  dailyData: { date: string; income: number; expense: number }[];
}

// 店铺信息
export interface ShopInfo {
  name: string;
  address?: string;
  phone?: string;
  wechatPayEnabled: boolean;
  alipayEnabled: boolean;
  voiceEnabled?: boolean;
}

// AI Agent 意图识别结果
export interface IntentResult {
  intent: 
    | 'record_income'      // 记录收入
    | 'record_expense'     // 记录支出
    | 'query_income'       // 查询收入
    | 'query_inventory'    // 查询库存
    | 'add_inventory'      // 补货
    | 'query_customer'     // 查询顾客
    | 'greeting'           // 问候
    | 'help'               // 帮助
    | 'unknown';           // 未知
  confidence: number;
  entities: {
    amount?: number;
    category?: ServiceCategory;
    customerName?: string;
    productName?: string;
    timeRange?: 'today' | 'week' | 'month' | 'year';
    paymentMethod?: PaymentMethod;
  };
}

