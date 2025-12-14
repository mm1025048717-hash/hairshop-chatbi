import { useStore } from '../store/useStore';
import { deepseekChat, isDeepSeekEnabled } from './deepseekClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatResponse {
  message: string;
  data?: {
    type: 'transaction' | 'query' | 'inventory' | 'chart' | 'insight' | 'payment' | 'action';
    payload?: any;
  };
  suggestions?: string[]; // 推荐操作
}

// AI人设 - 热情话痨的记账助手
const SYSTEM_PROMPT = `你是"小账"，理发店AI记账助手。性格：活泼热情、幽默风趣、像老朋友。

## 返回JSON格式：
{"text":"回复内容，自然亲切，30-60字","tips":["建议1","建议2","建议3","建议4"]}

## tips规则（重要）
每次tips必须不同！混合：
- 业务：记一笔、看今日、查库存、分析下
- 生活：累不累、中午吃啥、讲个笑话、天气咋样
- 延伸：根据对话内容自然延伸话题
禁止重复！要有创意！

## 回复风格
- 像朋友聊天，热情自然
- 可以开玩笑、关心对方
- 多用语气词：呀、啦、呢、哦
- 适当用表情描述：笑、开心

## 示例
用户：你好 → {"text":"嗨老板！今天店里生意咋样？有啥需要帮忙的尽管说~","tips":["记一笔","看今日","聊聊天","库存咋样"]}
用户：累死了 → {"text":"辛苦啦！开店不容易，今天业绩咋样？要不要看看今日账单？","tips":["看今日账","休息一下","明天目标","聊聊天"]}
用户：讲个笑话 → {"text":"来一个：为啥理发师都很有钱？因为他们从不剪短自己的收入！哈哈~","tips":["再来一个","记账吧","看看数据","明天见"]}`;

// 解析AI响应
interface ParsedResponse {
  text?: string;
  action?: string;
  amount?: number;
  category?: string;
  note?: string;
  tips?: string[];
}

function parseAIResponse(content: string): ParsedResponse | null {
  const trimmed = content.trim();
  try {
    // 尝试直接解析整个响应为JSON
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.text || parsed.action) {
        return {
          text: parsed.text,
          action: parsed.action,
          amount: parsed.amount,
          category: parsed.category,
          note: parsed.note,
          tips: parsed.tips,
        };
      }
    }
    
    // 尝试提取JSON部分
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.text || parsed.action) {
        return {
          text: parsed.text,
          action: parsed.action,
          amount: parsed.amount,
          category: parsed.category,
          note: parsed.note,
          tips: parsed.tips,
        };
      }
    }
  } catch (e) {
    console.log('[parseAI] JSON解析失败，使用纯文本');
  }
  
  // 纯文本回复 - 生成默认tips
  return { text: trimmed };
}

// 执行动作
function executeAction(action: string, params: any, store: ReturnType<typeof useStore.getState>): ChatResponse {
  switch (action) {
    case 'record_income': {
      const amount = Number(params.amount) || 0;
      if (amount <= 0) {
        return { message: '收了多少钱？', suggestions: ['38元剪发', '68元烫发', '取消'] };
      }
      
      const tx = store.addTransaction({
        type: 'income',
        amount,
        category: params.category || 'other',
        categoryLabel: params.note || '服务',
        paymentMethod: params.payment || 'cash',
      });
      
      const today = store.getTodayStats();
      
      return {
        message: `+${amount}元`,
        data: { 
          type: 'transaction', 
          payload: { ...tx, todayTotal: today.totalIncome, customerCount: today.customerCount }
        },
      };
    }
    
    case 'record_expense': {
      const amount = Number(params.amount) || 0;
      if (amount <= 0) {
        return { message: '花了多少？', suggestions: ['50元进货', '100元房租', '取消'] };
      }
      
      store.addTransaction({
        type: 'expense',
        amount,
        category: 'expense',
        categoryLabel: params.note || '支出',
        paymentMethod: 'cash',
      });
      
      const today = store.getTodayStats();
      
      return {
        message: `-${amount}元`,
        data: { type: 'query', payload: { ...today, expenseJustAdded: amount } },
      };
    }
    
    case 'query_today': {
      const stats = store.getTodayStats();
      return {
        message: '今日数据',
        data: { type: 'query', payload: stats },
      };
    }
    
    case 'query_month': {
      const now = new Date();
      const stats = store.getMonthStats(now.getFullYear(), now.getMonth());
      const days = now.getDate();
      const avgDaily = days > 0 ? Math.round(stats.totalIncome / days) : 0;
      
      return {
        message: '本月统计',
        data: { type: 'chart', payload: { ...stats, avgDaily, daysInMonth: days } },
      };
    }
    
    case 'query_inventory': {
      const { inventory } = store;
      
      if (inventory.length === 0) {
        return { message: '还没有库存记录' };
      }
      
      const low = inventory.filter(i => i.quantity <= i.alertThreshold);
      
      return {
        message: low.length > 0 ? `${low.length}项需补货` : '库存充足',
        data: { type: 'inventory', payload: inventory },
      };
    }
    
    case 'add_inventory': {
      if (!params.product) {
        return { message: '什么商品？', suggestions: ['洗发水', '染膏', '护发素'] };
      }
      const qty = Number(params.quantity) || 1;
      
      const existing = store.inventory.find(i => i.name.includes(params.product));
      
      if (existing) {
        const newQty = existing.quantity + qty;
        store.updateInventoryItem(existing.id, { quantity: newQty, lastRestockDate: new Date() });
        return { message: `${existing.name}+${qty}` };
      }
      
      store.addInventoryItem({
        name: params.product,
        quantity: qty,
        unit: '瓶',
        alertThreshold: 3,
        lastRestockDate: new Date(),
      });
      
      return { message: `新增${params.product}` };
    }
    
    case 'analyze': {
      const today = store.getTodayStats();
      const now = new Date();
      const month = store.getMonthStats(now.getFullYear(), now.getMonth());
      const { inventory } = store;
      const lowStock = inventory.filter(i => i.quantity <= i.alertThreshold);
      
      let insight = '';
      let type: 'good' | 'warning' = 'good';
      
      const avgDaily = month.totalIncome / (now.getDate() || 1);
      
      if (today.totalIncome > avgDaily * 1.2 && avgDaily > 0) {
        insight = '今日超出日均，不错！';
      } else if (lowStock.length > 0) {
        insight = `${lowStock.map(i => i.name).join('、')}该补货了`;
        type = 'warning';
      } else if (month.totalExpense > month.totalIncome * 0.4) {
        insight = '支出偏高，注意成本';
        type = 'warning';
      } else {
        insight = '经营正常，继续加油';
      }
      
      return {
        message: insight,
        data: { 
          type: 'insight', 
          payload: { 
            insightType: type, 
            title: '智能分析',
            content: insight,
            stats: { today, month, lowStock: lowStock.length }
          } 
        },
      };
    }
    
    case 'clear_chat': {
      // 返回特殊action让前端处理
      return {
        message: '聊天记录已清空，咱们重新开始聊吧~',
        data: { type: 'action', payload: { action: 'clear_chat' } },
      };
    }
    
    case 'clear_all': {
      // 账户清零 - 清空所有数据
      store.clearAllData();
      return {
        message: '账户已清零！所有交易记录都删除啦，从头开始记账吧，加油！',
        data: { type: 'action', payload: { action: 'clear_all' } },
      };
    }
    
    default:
      return { message: '没太听懂，能再说一遍吗？' };
  }
}

// 会话历史管理
export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
}

// 主聊天代理
export class ChatAgent {
  private history: { role: 'user' | 'assistant'; content: string }[] = [];
  private initialized = false;
  private currentSessionId: string = '';

  async initialize() {
    if (this.initialized) return;
    
    try {
      const savedHistory = await AsyncStorage.getItem('chat_history');
      if (savedHistory) {
        this.history = JSON.parse(savedHistory).slice(-20);
        console.log('[ChatAgent] 初始化完成，历史:', this.history.length, '条');
      }
      
      // 获取或创建当前会话ID
      const sessionId = await AsyncStorage.getItem('current_session_id');
      if (sessionId) {
        this.currentSessionId = sessionId;
      } else {
        this.currentSessionId = Date.now().toString();
        await AsyncStorage.setItem('current_session_id', this.currentSessionId);
      }
      
      this.initialized = true;
    } catch (e) {
      console.error('[ChatAgent] 初始化失败:', e);
    }
  }

  private async saveHistory() {
    try {
      await AsyncStorage.setItem('chat_history', JSON.stringify(this.history.slice(-20)));
    } catch {}
  }

  private buildContext(store: ReturnType<typeof useStore.getState>): string {
    const today = store.getTodayStats();
    const now = new Date();
    const { inventory } = store;
    const low = inventory.filter(i => i.quantity <= i.alertThreshold);
    
    return `[当前状态] ${now.getMonth()+1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}
今日收入¥${today.totalIncome} 支出¥${today.totalExpense} 顾客${today.customerCount}位
库存${inventory.length}种商品${low.length > 0 ? `，${low.map(i=>i.name).join('/')}需补货` : ''}`;
  }

  async processMessage(input: string): Promise<ChatResponse> {
    await this.initialize();
    
    const store = useStore.getState();
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();
    
    // ========== 第一步：本地意图识别，自动执行明确的业务操作 ==========
    const localAction = this.detectLocalIntent(lower, store);
    if (localAction) {
      console.log('[ChatAgent] 本地意图识别:', localAction.action);
      
      // 执行动作并获取数据
      const actionResult = executeAction(localAction.action, localAction.params, store);
      
      // 用AI生成回复和建议
      const aiReply = await this.generateSmartReply(localAction.action, actionResult, trimmed, store);
      
      this.history.push({ role: 'user', content: trimmed });
      this.history.push({ role: 'assistant', content: aiReply.message });
      this.saveHistory();
      
      return {
        message: aiReply.message,
        data: actionResult.data,
        suggestions: aiReply.suggestions,
      };
    }
    
    // ========== 第二步：尝试解析金额，自动记账 ==========
    const amountMatch = this.extractAmount(trimmed);
    if (amountMatch) {
      console.log('[ChatAgent] 检测到金额:', amountMatch);
      
      const tx = store.addTransaction({
        type: 'income',
        amount: amountMatch.amount,
        category: amountMatch.category || 'other',
        categoryLabel: amountMatch.label || '服务收入',
        paymentMethod: 'cash',
      });
      
      const today = store.getTodayStats();
      const aiReply = await this.generateSmartReply('record_income', { amount: amountMatch.amount, today }, trimmed, store);
      
      this.history.push({ role: 'user', content: trimmed });
      this.history.push({ role: 'assistant', content: aiReply.message });
      this.saveHistory();
      
      return {
        message: aiReply.message,
        data: { type: 'transaction', payload: { ...tx, todayTotal: today.totalIncome, customerCount: today.customerCount } },
        suggestions: aiReply.suggestions,
      };
    }
    
    // ========== 第三步：调用DeepSeek处理复杂对话 ==========
    this.history.push({ role: 'user', content: trimmed });
    if (this.history.length > 20) this.history = this.history.slice(-20);
    
    if (isDeepSeekEnabled()) {
      try {
        const context = this.buildContext(store);
        
        const messages = [
          { role: 'system' as const, content: SYSTEM_PROMPT },
          { role: 'user' as const, content: context },
          ...this.history.slice(-10).map(h => ({ 
            role: h.role as 'user' | 'assistant', 
            content: h.content 
          })),
        ];
        
        console.log('[ChatAgent] 调用DeepSeek处理对话');
        const response = await deepseekChat(messages, { temperature: 0.7 });
        console.log('[ChatAgent] 原始响应:', response.slice(0, 150));
        
        const parsed = parseAIResponse(response);
        
        if (parsed) {
          const aiTips = parsed.tips && Array.isArray(parsed.tips) && parsed.tips.length > 0 
            ? parsed.tips.slice(0, 4) 
            : this.getSmartSuggestions(store, parsed.action, trimmed);
          
          // 如果AI返回了action，执行它
          if (parsed.action) {
            const actionResult = executeAction(parsed.action, parsed, store);
            const result: ChatResponse = {
              message: parsed.text || actionResult.message,
              data: actionResult.data,
              suggestions: aiTips,
            };
            this.history.push({ role: 'assistant', content: result.message });
            this.saveHistory();
            return result;
          }
          
          // 纯文本回复
          const result: ChatResponse = { 
            message: parsed.text || '好的~', 
            suggestions: aiTips,
          };
          this.history.push({ role: 'assistant', content: result.message });
          this.saveHistory();
          return result;
        }
        
        // 解析失败
        const shortResponse = response.length > 60 ? response.slice(0, 60) + '...' : response;
        this.history.push({ role: 'assistant', content: shortResponse });
        this.saveHistory();
        return { message: shortResponse, suggestions: this.getSmartSuggestions(store, undefined, trimmed) };
        
      } catch (error: any) {
        console.error('[ChatAgent] DeepSeek错误:', error.message);
      }
    }
    
    return this.localFallback(trimmed, store);
  }
  
  // 本地意图识别 - 自动检测并执行
  private detectLocalIntent(lower: string, store: ReturnType<typeof useStore.getState>): { action: string; params: any } | null {
    // 账户清零
    if (lower.includes('账户清零') || lower.includes('清空账目') || lower.includes('删除数据') || 
        lower.includes('重置账户') || lower.includes('全部清空') || lower.includes('数据清零')) {
      store.clearAllData();
      return { action: 'clear_all', params: {} };
    }
    
    // 清空聊天
    if (lower.includes('清空聊天') || lower.includes('清除记录') || lower.includes('删除聊天')) {
      this.clearHistory();
      return { action: 'clear_chat', params: {} };
    }
    
    // 查库存
    if (lower.includes('库存') || lower.includes('存货') || lower.includes('商品') || lower.includes('物料')) {
      return { action: 'query_inventory', params: {} };
    }
    
    // 查今日收入
    if ((lower.includes('今') && (lower.includes('收入') || lower.includes('账') || lower.includes('营业') || lower.includes('进账'))) ||
        lower.includes('今日账') || lower.includes('今天赚')) {
      return { action: 'query_today', params: {} };
    }
    
    // 查本月
    if (lower.includes('本月') || lower.includes('这个月') || lower.includes('月收入') || lower.includes('月账')) {
      return { action: 'query_month', params: {} };
    }
    
    // 分析
    if (lower.includes('分析') || lower.includes('洞察') || lower.includes('建议') || lower.includes('情况怎么样')) {
      return { action: 'analyze', params: {} };
    }
    
    // 记支出
    if (lower.includes('支出') || lower.includes('花了') || lower.includes('买了') || lower.includes('进货')) {
      const match = lower.match(/(\d+)/);
      if (match) {
        return { action: 'record_expense', params: { amount: parseInt(match[1]), note: '支出' } };
      }
    }
    
    return null;
  }
  
  // 提取金额和服务类型
  private extractAmount(input: string): { amount: number; category?: string; label?: string } | null {
    // 匹配各种金额表达方式
    const patterns = [
      /(\d+)块?钱?.*?(剪发|剪头|理发)/,
      /(\d+)块?钱?.*?(烫发|烫头)/,
      /(\d+)块?钱?.*?(染发|染头)/,
      /(\d+)块?钱?.*?(洗头|洗发)/,
      /(\d+)块?钱?.*?(护理)/,
      /(剪发|剪头|理发).*?(\d+)/,
      /(烫发|烫头).*?(\d+)/,
      /(染发|染头).*?(\d+)/,
      /(洗头|洗发).*?(\d+)/,
      /收了?(\d+)/,
      /来了?(\d+)/,
      /进账(\d+)/,
      /(\d+)元/,
      /^(\d+)$/,  // 纯数字
    ];
    
    const categoryMap: Record<string, { category: string; label: string }> = {
      '剪发': { category: 'haircut', label: '剪发' },
      '剪头': { category: 'haircut', label: '剪发' },
      '理发': { category: 'haircut', label: '剪发' },
      '烫发': { category: 'perm', label: '烫发' },
      '烫头': { category: 'perm', label: '烫发' },
      '染发': { category: 'dye', label: '染发' },
      '染头': { category: 'dye', label: '染发' },
      '洗头': { category: 'wash', label: '洗头' },
      '洗发': { category: 'wash', label: '洗头' },
      '护理': { category: 'treatment', label: '护理' },
    };
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        let amount = 0;
        let categoryInfo: { category: string; label: string } | undefined;
        
        for (const m of match.slice(1)) {
          if (/^\d+$/.test(m)) {
            amount = parseInt(m);
          } else if (categoryMap[m]) {
            categoryInfo = categoryMap[m];
          }
        }
        
        if (amount > 0 && amount < 100000) {  // 合理金额范围
          return {
            amount,
            category: categoryInfo?.category,
            label: categoryInfo?.label,
          };
        }
      }
    }
    
    return null;
  }
  
  // 用AI生成智能回复
  private async generateSmartReply(
    action: string, 
    result: any, 
    userInput: string, 
    store: ReturnType<typeof useStore.getState>
  ): Promise<{ message: string; suggestions: string[] }> {
    
    // 根据action和结果生成回复
    const today = store.getTodayStats();
    const { inventory } = store;
    const lowStock = inventory.filter(i => i.quantity <= i.alertThreshold);
    
    let message = '';
    let suggestions: string[] = [];
    
    switch (action) {
      case 'query_inventory':
        if (inventory.length === 0) {
          message = '库存还是空的呢~要不要添加一些商品？直接说"洗发水10瓶"我就帮你记上！';
          suggestions = ['添加洗发水', '添加染发膏', '记一笔收入', '聊点别的'];
        } else {
          const items = inventory.map(i => `${i.name}${i.quantity}${i.unit}${i.quantity <= i.alertThreshold ? '(需补货)' : ''}`).join('、');
          message = `库存明细来啦：${items}。${lowStock.length > 0 ? `注意！${lowStock.map(i => i.name).join('、')}库存偏低，该补货了！` : '库存充足，放心营业~'}`;
          suggestions = lowStock.length > 0 
            ? ['补货洗发水', '今日收入', '帮我分析', '还有啥事'] 
            : ['记一笔', '今日收入', '分析经营', '聊会天'];
        }
        break;
        
      case 'query_today':
        if (today.totalIncome === 0 && today.totalExpense === 0) {
          message = '今天还没开张呢~加油加油，好运马上来！第一单记得告诉我哦~';
          suggestions = ['记一笔收入', '看看库存', '讲个笑话', '天气咋样'];
        } else {
          const profit = today.totalIncome - today.totalExpense;
          message = `今日战报：收入¥${today.totalIncome}，支出¥${today.totalExpense}，净赚¥${profit}，服务了${today.customerCount}位顾客！${profit > 500 ? '今天业绩不错啊老板！' : profit > 0 ? '稳扎稳打，继续加油~' : '今天有点难，明天会更好！'}`;
          suggestions = ['继续记账', '本月总账', '帮我分析', '休息一下'];
        }
        break;
        
      case 'query_month':
        const now = new Date();
        const month = store.getMonthStats(now.getFullYear(), now.getMonth());
        const avgDaily = now.getDate() > 0 ? Math.round(month.totalIncome / now.getDate()) : 0;
        message = `本月战报：收入¥${month.totalIncome}，支出¥${month.totalExpense}，净利润¥${month.netProfit}，日均¥${avgDaily}。${month.netProfit > 5000 ? '这个月赚麻了！' : month.netProfit > 0 ? '稳步前进中~' : '控制成本，下月加油！'}`;
        suggestions = ['看今日', '分析建议', '记一笔', '聊聊天'];
        break;
        
      case 'record_income':
        const amount = result.amount || 0;
        const todayNow = result.today || today;
        message = `收到！+${amount}元已入账，今日累计收入¥${todayNow.totalIncome}，已服务${todayNow.customerCount}位顾客！${todayNow.totalIncome > 1000 ? '今天业绩火爆！' : '继续加油，财源滚滚来~'}`;
        suggestions = ['再来一单', '今日总账', '看看库存', '休息一下'];
        break;
        
      case 'record_expense':
        message = `支出已记录！今日支出¥${today.totalExpense}。精打细算，生意兴隆~`;
        suggestions = ['今日账单', '看收入', '分析一下', '聊会天'];
        break;
        
      case 'analyze':
        let insight = '';
        if (today.totalIncome > 0) {
          const avgCustomerSpend = today.customerCount > 0 ? Math.round(today.totalIncome / today.customerCount) : 0;
          insight = `今日分析：客单价¥${avgCustomerSpend}，`;
          if (avgCustomerSpend > 50) {
            insight += '客单价不错！可以考虑推推会员卡~';
          } else {
            insight += '可以试试推荐护理项目提升客单价哦~';
          }
        }
        if (lowStock.length > 0) {
          insight += `\n库存预警：${lowStock.map(i => i.name).join('、')}该补货了！`;
        }
        if (!insight) {
          insight = '数据还不够多，多记几笔账我就能给你更准确的分析啦~';
        }
        message = insight;
        suggestions = ['记一笔', '看库存', '今日账', '聊聊天'];
        break;
        
      case 'clear_all':
        message = '账户已清零！所有数据都删掉了，咱们从零开始，一起加油！';
        suggestions = ['记第一笔', '添加库存', '设置店铺', '聊会天'];
        break;
        
      case 'clear_chat':
        message = '聊天记录清空啦，有什么需要帮忙的随时说~';
        suggestions = ['记一笔', '今日账', '看库存', '聊聊天'];
        break;
        
      default:
        message = '好的~';
        suggestions = this.getSmartSuggestions(store, undefined, userInput);
    }
    
    return { message, suggestions };
  }
  
  private getSmartSuggestions(store: ReturnType<typeof useStore.getState>, lastAction?: string, userInput?: string): string[] {
    const today = store.getTodayStats();
    const { inventory } = store;
    const lowStock = inventory.filter(i => i.quantity <= i.alertThreshold);
    const hour = new Date().getHours();
    const day = new Date().getDay(); // 0周日 1-6周一到周六
    const suggestions: string[] = [];
    
    // 随机池 - 生活话题
    const funPool = [
      '讲个笑话', '今天运势咋样', '聊会天', '鼓励一下我', 
      '最近累不累', '有啥开心事', '今天心情如何', '给点建议',
      '夸夸我', '说点有趣的', '陪我唠嗑', '今天忙不忙'
    ];
    
    // 随机池 - 业务话题
    const bizPool = [
      '记一笔', '看今日', '本月统计', '帮我分析',
      '查库存', '收支明细', '趋势分析', '经营建议'
    ];
    
    // 时间相关话题
    const timePool: string[] = [];
    if (hour >= 6 && hour < 9) {
      timePool.push('早安', '今天加油', '新的一天开始啦');
    } else if (hour >= 11 && hour < 13) {
      timePool.push('午饭吃了吗', '中午歇会儿', '上午咋样');
    } else if (hour >= 17 && hour < 20) {
      timePool.push('今日结算', '准备下班', '晚上吃啥');
    } else if (hour >= 21 || hour < 6) {
      timePool.push('早点休息', '晚安', '明天见');
    }
    
    // 周末特殊
    if (day === 0 || day === 6) {
      timePool.push('周末愉快', '今天人多吗');
    }
    
    // 基于上次动作推荐
    if (lastAction === 'record_income') {
      suggestions.push(this.randomPick(['继续记账', '再来一单', '下一位']));
      suggestions.push(this.randomPick(['今日汇总', '看看今天', '收了多少']));
    } else if (lastAction === 'query_today') {
      suggestions.push(this.randomPick(['本月对比', '帮我分析', '详细数据']));
    } else if (lastAction === 'query_month') {
      suggestions.push(this.randomPick(['环比上月', '看趋势', '哪天最好']));
    } else if (lastAction === 'clear_chat') {
      suggestions.push('重新开始');
    }
    
    // 基于业务状态
    if (today.totalIncome > 500) {
      suggestions.push(this.randomPick([`今日${today.totalIncome}不错`, '生意兴隆', '继续加油']));
    } else if (today.customerCount > 0) {
      suggestions.push(`已服务${today.customerCount}位`);
    }
    
    if (lowStock.length > 0) {
      suggestions.push(`${lowStock[0].name}要补货了`);
    }
    
    // 填充时间话题
    if (timePool.length > 0 && suggestions.length < 3) {
      suggestions.push(this.randomPick(timePool));
    }
    
    // 填充生活话题（随机1-2个）
    while (suggestions.length < 3) {
      const fun = this.randomPick(funPool);
      if (!suggestions.includes(fun)) {
        suggestions.push(fun);
      }
    }
    
    // 填充业务话题
    while (suggestions.length < 4) {
      const biz = this.randomPick(bizPool);
      if (!suggestions.some(s => s.includes(biz.slice(0, 2)))) {
        suggestions.push(biz);
      }
    }
    
    // 打乱顺序让它看起来更随机
    return this.shuffle(suggestions).slice(0, 4);
  }
  
  private randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  private shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  private localFallback(input: string, store: ReturnType<typeof useStore.getState>): ChatResponse {
    const lower = input.toLowerCase();
    const numMatch = input.match(/(\d+)/);
    const amount = numMatch ? parseInt(numMatch[1]) : 0;
    
    if (amount > 0 && (lower.includes('收') || lower.includes('入'))) {
      const tx = store.addTransaction({
        type: 'income',
        amount,
        category: 'other',
        categoryLabel: '服务',
        paymentMethod: 'cash',
      });
      const today = store.getTodayStats();
      return {
        message: `+${amount}元`,
        data: { type: 'transaction', payload: { ...tx, todayTotal: today.totalIncome } },
        suggestions: this.getSmartSuggestions(store, 'record_income', input),
      };
    }
    
    if (lower.includes('今') && (lower.includes('收') || lower.includes('多少'))) {
      const stats = store.getTodayStats();
      return {
        message: '今日数据',
        data: { type: 'query', payload: stats },
        suggestions: this.getSmartSuggestions(store, 'query_today', input),
      };
    }
    
    return { message: '试试点击下方按钮', suggestions: this.getSmartSuggestions(store, undefined, input) };
  }

  async clearHistory() {
    this.history = [];
    await AsyncStorage.removeItem('chat_history');
    console.log('[ChatAgent] 历史已清空');
  }
  
  // 获取所有会话列表
  async getSessions(): Promise<ChatSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem('chat_sessions');
      if (sessionsJson) {
        return JSON.parse(sessionsJson);
      }
    } catch {}
    return [];
  }
  
  // 保存当前会话
  async saveSession(title?: string) {
    try {
      const sessions = await this.getSessions();
      const session: ChatSession = {
        id: this.currentSessionId,
        title: title || `会话 ${new Date().toLocaleDateString()}`,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        messageCount: this.history.length,
      };
      
      const existingIndex = sessions.findIndex(s => s.id === this.currentSessionId);
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session);
      }
      
      // 最多保留20个会话
      const trimmedSessions = sessions.slice(0, 20);
      await AsyncStorage.setItem('chat_sessions', JSON.stringify(trimmedSessions));
      
      // 保存当前会话的消息
      await AsyncStorage.setItem(`session_${this.currentSessionId}`, JSON.stringify(this.history));
      
    } catch (e) {
      console.error('[ChatAgent] 保存会话失败:', e);
    }
  }
  
  // 加载历史会话
  async loadSession(sessionId: string): Promise<boolean> {
    try {
      const historyJson = await AsyncStorage.getItem(`session_${sessionId}`);
      if (historyJson) {
        this.history = JSON.parse(historyJson);
        this.currentSessionId = sessionId;
        await AsyncStorage.setItem('current_session_id', sessionId);
        return true;
      }
    } catch {}
    return false;
  }
  
  // 开始新会话
  async startNewSession() {
    // 保存当前会话
    if (this.history.length > 0) {
      await this.saveSession();
    }
    
    // 创建新会话
    this.history = [];
    this.currentSessionId = Date.now().toString();
    await AsyncStorage.setItem('current_session_id', this.currentSessionId);
    await AsyncStorage.removeItem('chat_history');
    
    console.log('[ChatAgent] 新会话已创建:', this.currentSessionId);
  }
  
  // 删除会话
  async deleteSession(sessionId: string) {
    try {
      const sessions = await this.getSessions();
      const filtered = sessions.filter(s => s.id !== sessionId);
      await AsyncStorage.setItem('chat_sessions', JSON.stringify(filtered));
      await AsyncStorage.removeItem(`session_${sessionId}`);
    } catch {}
  }

  getCurrentSessionId() {
    return this.currentSessionId;
  }
}

export const chatAgent = new ChatAgent();

