import { 
  Transaction, 
  PaymentMethod, 
  ServiceCategory,
  IntentResult,
  InventoryItem 
} from '../types';

// 服务项目映射
const SERVICE_MAP: Record<string, { category: ServiceCategory; label: string; defaultPrice: number }> = {
  '剪发': { category: 'haircut', label: '剪发', defaultPrice: 25 },
  '剪头': { category: 'haircut', label: '剪发', defaultPrice: 25 },
  '理发': { category: 'haircut', label: '剪发', defaultPrice: 25 },
  '洗剪': { category: 'wash_cut', label: '洗剪', defaultPrice: 30 },
  '洗剪吹': { category: 'wash_cut_blow', label: '洗剪吹', defaultPrice: 38 },
  '烫发': { category: 'perm', label: '烫发', defaultPrice: 200 },
  '烫头': { category: 'perm', label: '烫发', defaultPrice: 200 },
  '染发': { category: 'dye', label: '染发', defaultPrice: 150 },
  '染头': { category: 'dye', label: '染发', defaultPrice: 150 },
  '护理': { category: 'care', label: '护理', defaultPrice: 80 },
  '焗油': { category: 'care', label: '焗油护理', defaultPrice: 100 },
};

// 支付方式映射
const PAYMENT_MAP: Record<string, PaymentMethod> = {
  '微信': 'wechat',
  '支付宝': 'alipay',
  '现金': 'cash',
  '刷卡': 'card',
  '银行卡': 'card',
};

// 时间范围关键词
const TIME_KEYWORDS = {
  today: ['今天', '今日', '当天'],
  week: ['本周', '这周', '这个星期', '一周'],
  month: ['本月', '这个月', '月', '这月'],
  year: ['今年', '本年', '全年'],
};

/**
 * AI Agent - 解析用户自然语言输入
 */
export class AIAgent {
  
  /**
   * 解析用户输入，识别意图
   */
  parseIntent(input: string): IntentResult {
    const normalizedInput = input.toLowerCase().trim();
    
    // 记录收入意图
    if (this.isIncomeIntent(normalizedInput)) {
      return this.parseIncomeIntent(normalizedInput);
    }
    
    // 记录支出意图
    if (this.isExpenseIntent(normalizedInput)) {
      return this.parseExpenseIntent(normalizedInput);
    }
    
    // 查询收入意图
    if (this.isQueryIncomeIntent(normalizedInput)) {
      return this.parseQueryIntent(normalizedInput, 'query_income');
    }
    
    // 查询库存意图
    if (this.isQueryInventoryIntent(normalizedInput)) {
      return this.parseInventoryIntent(normalizedInput);
    }
    
    // 补货意图
    if (this.isAddInventoryIntent(normalizedInput)) {
      return this.parseAddInventoryIntent(normalizedInput);
    }
    
    // 问候
    if (this.isGreeting(normalizedInput)) {
      return { intent: 'greeting', confidence: 0.9, entities: {} };
    }
    
    // 帮助
    if (this.isHelpIntent(normalizedInput)) {
      return { intent: 'help', confidence: 0.9, entities: {} };
    }
    
    return { intent: 'unknown', confidence: 0.3, entities: {} };
  }

  /**
   * 判断是否是收入记录意图
   */
  private isIncomeIntent(input: string): boolean {
    const keywords = ['收', '进账', '入账', '来了', '结账', '付款', '成交'];
    return keywords.some(k => input.includes(k)) && this.extractAmount(input) !== null;
  }

  /**
   * 判断是否是支出意图
   */
  private isExpenseIntent(input: string): boolean {
    const keywords = ['花', '买', '进货', '采购', '支出', '付了', '开支'];
    return keywords.some(k => input.includes(k)) && this.extractAmount(input) !== null;
  }

  /**
   * 判断是否是查询收入意图
   */
  private isQueryIncomeIntent(input: string): boolean {
    const keywords = ['收入', '赚', '营收', '营业额', '流水', '多少钱', '收了多少', '进账'];
    const queryWords = ['多少', '查', '看看', '统计', '报表', '怎么样'];
    return keywords.some(k => input.includes(k)) || 
           (queryWords.some(q => input.includes(q)) && !input.includes('库存'));
  }

  /**
   * 判断是否是查询库存意图
   */
  private isQueryInventoryIntent(input: string): boolean {
    const keywords = ['库存', '还剩', '剩余', '有多少', '够不够', '还有'];
    const products = ['洗发水', '护发素', '染发膏', '烫发药水', '发膜'];
    return keywords.some(k => input.includes(k)) || 
           products.some(p => input.includes(p) && (input.includes('多少') || input.includes('剩')));
  }

  /**
   * 判断是否是补货意图
   */
  private isAddInventoryIntent(input: string): boolean {
    const keywords = ['进货', '补货', '进了', '采购了', '买了'];
    const products = ['洗发水', '护发素', '染发膏', '烫发药水'];
    return keywords.some(k => input.includes(k)) && 
           products.some(p => input.includes(p));
  }

  /**
   * 判断是否是问候
   */
  private isGreeting(input: string): boolean {
    const keywords = ['你好', '在吗', '嗨', 'hi', 'hello', '早上好', '下午好', '晚上好'];
    return keywords.some(k => input.includes(k));
  }

  /**
   * 判断是否是帮助意图
   */
  private isHelpIntent(input: string): boolean {
    const keywords = ['帮助', '怎么用', '怎么操作', '使用方法', '功能', '能做什么'];
    return keywords.some(k => input.includes(k));
  }

  /**
   * 解析收入意图
   */
  private parseIncomeIntent(input: string): IntentResult {
    const amount = this.extractAmount(input);
    const category = this.extractServiceCategory(input);
    const customerName = this.extractCustomerName(input);
    const paymentMethod = this.extractPaymentMethod(input);

    return {
      intent: 'record_income',
      confidence: amount ? 0.9 : 0.6,
      entities: {
        amount: amount || undefined,
        category: category?.category,
        customerName,
        paymentMethod,
      }
    };
  }

  /**
   * 解析支出意图
   */
  private parseExpenseIntent(input: string): IntentResult {
    const amount = this.extractAmount(input);
    const productName = this.extractProductName(input);

    return {
      intent: 'record_expense',
      confidence: amount ? 0.9 : 0.6,
      entities: {
        amount: amount || undefined,
        productName,
      }
    };
  }

  /**
   * 解析查询意图
   */
  private parseQueryIntent(input: string, intent: 'query_income' | 'query_customer'): IntentResult {
    const timeRange = this.extractTimeRange(input);
    
    return {
      intent,
      confidence: 0.85,
      entities: {
        timeRange,
      }
    };
  }

  /**
   * 解析库存查询意图
   */
  private parseInventoryIntent(input: string): IntentResult {
    const productName = this.extractProductName(input);
    
    return {
      intent: 'query_inventory',
      confidence: 0.85,
      entities: {
        productName,
      }
    };
  }

  /**
   * 解析补货意图
   */
  private parseAddInventoryIntent(input: string): IntentResult {
    const amount = this.extractAmount(input);
    const productName = this.extractProductName(input);
    const quantity = this.extractQuantity(input);
    
    return {
      intent: 'add_inventory',
      confidence: 0.85,
      entities: {
        amount: amount || undefined,
        productName,
      }
    };
  }

  /**
   * 从文本中提取金额
   */
  extractAmount(input: string): number | null {
    // 匹配各种金额格式: 38块, 38元, ¥38, 38
    const patterns = [
      /(\d+(?:\.\d{1,2})?)\s*[块元圆]/,
      /[¥￥]\s*(\d+(?:\.\d{1,2})?)/,
      /(\d+(?:\.\d{1,2})?)\s*(?:块钱|元钱)/,
      /收[了]?\s*(\d+(?:\.\d{1,2})?)/,
      /(\d+(?:\.\d{1,2})?)/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    return null;
  }

  /**
   * 提取服务类型
   */
  extractServiceCategory(input: string): { category: ServiceCategory; label: string } | null {
    for (const [keyword, info] of Object.entries(SERVICE_MAP)) {
      if (input.includes(keyword)) {
        return { category: info.category, label: info.label };
      }
    }
    return { category: 'other', label: '其他服务' };
  }

  /**
   * 提取顾客姓名
   */
  extractCustomerName(input: string): string | undefined {
    // 匹配 "老X"、"X哥"、"X姐" 等称呼
    const patterns = [
      /老([李王张刘陈杨赵黄周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董萧程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶阎余潘杜戴夏钟汪田任姜范方石姚谭廖周邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段雷钱汤尹黎易常武乔贺赖龚文])/,
      /([李王张刘陈杨赵黄周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董萧程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶阎余潘杜戴夏钟汪田任姜范方石姚谭廖周邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段雷钱汤尹黎易常武乔贺赖龚文])[哥姐叔婶阿姨]/,
      /([A-Za-z\u4e00-\u9fa5]{1,4}?)(?:先生|女士|小姐)/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return undefined;
  }

  /**
   * 提取支付方式
   */
  extractPaymentMethod(input: string): PaymentMethod | undefined {
    for (const [keyword, method] of Object.entries(PAYMENT_MAP)) {
      if (input.includes(keyword)) {
        return method;
      }
    }
    return undefined;
  }

  /**
   * 提取产品名称
   */
  extractProductName(input: string): string | undefined {
    const products = ['洗发水', '护发素', '染发膏', '烫发药水', '发膜', '定型水', '发蜡', '梳子', '剪刀'];
    for (const product of products) {
      if (input.includes(product)) {
        return product;
      }
    }
    return undefined;
  }

  /**
   * 提取数量
   */
  extractQuantity(input: string): number | undefined {
    const match = input.match(/(\d+)\s*(?:瓶|盒|箱|套|个|把)/);
    if (match) {
      return parseInt(match[1]);
    }
    return undefined;
  }

  /**
   * 提取时间范围
   */
  extractTimeRange(input: string): 'today' | 'week' | 'month' | 'year' | undefined {
    for (const [range, keywords] of Object.entries(TIME_KEYWORDS)) {
      if (keywords.some(k => input.includes(k))) {
        return range as 'today' | 'week' | 'month' | 'year';
      }
    }
    // 默认今天
    return 'today';
  }

  /**
   * 获取服务项目默认价格
   */
  getDefaultPrice(category: ServiceCategory): number {
    const found = Object.values(SERVICE_MAP).find(s => s.category === category);
    return found?.defaultPrice || 0;
  }

  /**
   * 获取服务项目标签
   */
  getCategoryLabel(category: ServiceCategory | string): string {
    const found = Object.values(SERVICE_MAP).find(s => s.category === category);
    return found?.label || '其他服务';
  }
}

export const aiAgent = new AIAgent();

