import { 
  Transaction, 
  DailyStats, 
  InventoryItem,
  IntentResult,
  PaymentMethod 
} from '../types';
import { aiAgent } from './aiAgent';

// 支付方式中文映射
const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  wechat: '微信',
  alipay: '支付宝',
  cash: '现金',
  card: '刷卡',
};

/**
 * AI响应生成器 - 生成自然语言回复
 */
export class ResponseGenerator {
  
  /**
   * 生成记账成功回复
   */
  generateIncomeRecordResponse(
    transaction: Transaction, 
    todayStats: DailyStats
  ): string {
    const parts: string[] = [];
    
    // 确认信息
    parts.push(`好的，已记录收入 ${transaction.amount}元`);
    
    // 服务项目
    if (transaction.categoryLabel && transaction.categoryLabel !== '其他服务') {
      parts.push(`\n📋 服务项目：${transaction.categoryLabel}`);
    }
    
    // 顾客
    if (transaction.customerName) {
      parts.push(`\n👤 顾客：${transaction.customerName}`);
    }
    
    // 支付方式
    if (transaction.paymentMethod) {
      parts.push(`\n💳 支付方式：${PAYMENT_LABELS[transaction.paymentMethod]}`);
    }
    
    // 今日统计
    parts.push(`\n\n今日累计收入：${todayStats.totalIncome}元，接待 ${todayStats.customerCount} 位顾客`);
    
    // 鼓励语
    // 轻量鼓励（不使用表情/Markdown，保持苹果风）
    if (todayStats.customerCount >= 5) {
      parts.push(`\n今天挺忙的，辛苦了。`);
    }
    
    return parts.join('');
  }

  /**
   * 生成支出记录回复
   */
  generateExpenseRecordResponse(
    amount: number,
    productName?: string,
    todayStats?: DailyStats
  ): string {
    const parts: string[] = [];
    
    parts.push(`已记录支出 ${amount}元`);
    
    if (productName) {
      parts.push(`\n商品：${productName}`);
    }
    
    if (todayStats) {
      parts.push(`\n\n今日净收入：${todayStats.totalIncome - todayStats.totalExpense}元`);
    }
    
    return parts.join('');
  }

  /**
   * 生成收入查询回复
   */
  generateIncomeQueryResponse(
    timeRange: 'today' | 'week' | 'month' | 'year',
    stats: {
      totalIncome: number;
      totalExpense: number;
      netProfit: number;
      transactionCount?: number;
      customerCount?: number;
      topService?: string;
      growthRate?: number;
    }
  ): string {
    const parts: string[] = [];
    
    const timeLabels = {
      today: '今日',
      week: '本周',
      month: '本月',
      year: '今年',
    };
    
    const timeLabel = timeLabels[timeRange];
    
    parts.push(`${timeLabel}经营数据\n`);
    parts.push(`总收入：${stats.totalIncome.toLocaleString()}元`);
    parts.push(`\n总支出：${stats.totalExpense.toLocaleString()}元`);
    parts.push(`\n净利润：${stats.netProfit.toLocaleString()}元`);
    
    if (stats.customerCount !== undefined) {
      parts.push(`\n接待顾客：${stats.customerCount}人`);
    }
    
    if (stats.topService) {
      parts.push(`\n热门项目：${stats.topService}`);
    }
    
    if (stats.growthRate !== undefined) {
      const trend = stats.growthRate >= 0 ? '增长' : '下降';
      parts.push(`\n环比${trend}：${Math.abs(stats.growthRate).toFixed(1)}%`);
    }
    
    return parts.join('');
  }

  /**
   * 生成库存查询回复
   */
  generateInventoryQueryResponse(
    items: InventoryItem[],
    queryProduct?: string
  ): string {
    if (queryProduct) {
      const item = items.find(i => i.name === queryProduct);
      if (item) {
        const isLow = item.quantity <= item.alertThreshold;
        const status = isLow ? '库存偏低' : '库存正常';
        let response = `${item.name}\n`;
        response += `数量：${item.quantity}${item.unit}\n`;
        response += `状态：${status}`;
        
        if (isLow) {
          response += `\n\n建议补货：低于${item.alertThreshold}${item.unit}`;
        }
        
        return response;
      } else {
        return `没有找到“${queryProduct}”的库存记录。\n\n需要我帮你添加这个商品吗？`;
      }
    }
    
    // 显示所有库存
    const parts: string[] = ['当前库存\n'];
    
    const lowStock: InventoryItem[] = [];
    const normalStock: InventoryItem[] = [];
    
    items.forEach(item => {
      if (item.quantity <= item.alertThreshold) {
        lowStock.push(item);
      } else {
        normalStock.push(item);
      }
    });
    
    // 先显示低库存
    if (lowStock.length > 0) {
      parts.push('需要补货：');
      lowStock.forEach(item => {
        parts.push(`\n• ${item.name}：${item.quantity}${item.unit}`);
      });
      parts.push('\n');
    }
    
    // 再显示正常库存
    if (normalStock.length > 0) {
      parts.push('\n库存正常：');
      normalStock.forEach(item => {
        parts.push(`\n• ${item.name}：${item.quantity}${item.unit}`);
      });
    }
    
    return parts.join('');
  }

  /**
   * 生成补货成功回复
   */
  generateAddInventoryResponse(
    productName: string,
    addedQuantity: number,
    newQuantity: number,
    unit: string,
    cost?: number
  ): string {
    let response = `已更新库存\n\n`;
    response += `${productName}\n`;
    response += `• 入库：+${addedQuantity}${unit}\n`;
    response += `• 现有：${newQuantity}${unit}`;
    
    if (cost) {
      response += `\n• 花费：${cost}元`;
    }
    
    return response;
  }

  /**
   * 生成问候回复
   */
  generateGreetingResponse(todayStats: DailyStats): string {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = '早上好';
    } else if (hour < 18) {
      greeting = '下午好';
    } else {
      greeting = '晚上好';
    }
    
    let response = `${greeting} \n\n`;
    
    if (todayStats.totalIncome > 0) {
      response += `今日已收入 ${todayStats.totalIncome}元，接待 ${todayStats.customerCount} 位顾客\n\n`;
    }
    
    response += '有什么需要帮忙的吗？';
    
    return response;
  }

  /**
   * 生成帮助回复
   */
  generateHelpResponse(): string {
    return `我能帮你做这些事：

【记账】
• "收了一个洗剪吹38块"
• "老李烫头收了280"
• "买洗发水花了150"

【查账】
• "今天收入多少"
• "这个月赚了多少"
• "看看本周营业额"

【库存】
• "洗发水还剩多少"
• "查看库存"
• "进了5瓶洗发水"

【顾客】
• "老李上次来是什么时候"

直接说话就行，不用点按钮。`;
  }

  /**
   * 生成未理解回复
   */
  generateUnknownResponse(): string {
    const responses = [
      '我没太理解。\n\n可以试试说：\n• "收了38块"\n• "今天收入多少"\n• "洗发水还剩几瓶"',
      '没听明白。\n\n你可以这样说：\n• "洗剪吹38"\n• "查一下本月收入"\n• "进货洗发水5瓶"',
      '我不确定怎么处理。\n\n试试告诉我：\n• 要记账：说金额和项目\n• 要查询：说查什么\n• 要帮助：说"帮助"',
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * 生成需要确认金额的回复
   */
  generateNeedAmountResponse(category?: string): string {
    if (category) {
      return `收到，${category}项目。请问收了多少钱呢？`;
    }
    return '好的，请问收了多少钱？';
  }
}

export const responseGenerator = new ResponseGenerator();

