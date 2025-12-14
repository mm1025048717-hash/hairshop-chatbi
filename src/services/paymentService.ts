/**
 * 支付服务 - 对接微信支付、支付宝等支付渠道
 * 
 * 注意：实际对接支付需要：
 * 1. 注册微信支付商户号 / 支付宝开放平台账号
 * 2. 完成实名认证和商户资质审核
 * 3. 配置支付密钥和证书
 * 4. 搭建后端服务处理支付回调
 */

export interface PaymentConfig {
  wechat?: {
    appId: string;
    mchId: string;  // 商户号
    apiKey: string;
    certPath?: string;
  };
  alipay?: {
    appId: string;
    privateKey: string;
    alipayPublicKey: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  paymentMethod?: 'wechat' | 'alipay';
  error?: string;
}

export interface PaymentRecord {
  transactionId: string;
  amount: number;
  paymentMethod: 'wechat' | 'alipay';
  status: 'pending' | 'success' | 'failed' | 'refunded';
  createdAt: Date;
  customerInfo?: {
    openId?: string;
    nickname?: string;
  };
}

/**
 * 支付服务类
 */
export class PaymentService {
  private config: PaymentConfig = {};
  private records: PaymentRecord[] = [];

  /**
   * 配置支付参数
   */
  configure(config: PaymentConfig) {
    this.config = config;
  }

  /**
   * 生成微信支付二维码
   * 
   * 实际实现需要：
   * 1. 调用微信统一下单接口
   * 2. 获取 code_url 生成二维码
   * 3. 轮询查询支付结果
   */
  async generateWechatPayQR(amount: number, description: string): Promise<{
    qrCodeUrl: string;
    orderId: string;
  }> {
    // 模拟生成订单
    const orderId = `WX${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`[WeChat Pay] 生成支付订单: ${orderId}, 金额: ${amount}元`);
    
    // 模拟返回二维码链接（实际是 weixin://wxpay/bizpayurl?... 格式）
    return {
      qrCodeUrl: `weixin://wxpay/demo/${orderId}`,
      orderId,
    };
  }

  /**
   * 生成支付宝支付二维码
   */
  async generateAlipayQR(amount: number, description: string): Promise<{
    qrCodeUrl: string;
    orderId: string;
  }> {
    const orderId = `ALI${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`[Alipay] 生成支付订单: ${orderId}, 金额: ${amount}元`);
    
    return {
      qrCodeUrl: `alipays://demo/${orderId}`,
      orderId,
    };
  }

  /**
   * 查询支付状态
   */
  async queryPaymentStatus(orderId: string): Promise<PaymentResult> {
    // 模拟查询
    const record = this.records.find(r => r.transactionId === orderId);
    
    if (!record) {
      return {
        success: false,
        error: '订单不存在',
      };
    }

    return {
      success: record.status === 'success',
      transactionId: record.transactionId,
      amount: record.amount,
      paymentMethod: record.paymentMethod,
    };
  }

  /**
   * 模拟收到支付回调
   * 实际场景中这是由支付平台推送到你的服务器
   */
  simulatePaymentCallback(orderId: string, success: boolean): PaymentRecord {
    const existingIndex = this.records.findIndex(r => r.transactionId === orderId);
    
    const record: PaymentRecord = {
      transactionId: orderId,
      amount: Math.floor(Math.random() * 200) + 20, // 模拟金额
      paymentMethod: orderId.startsWith('WX') ? 'wechat' : 'alipay',
      status: success ? 'success' : 'failed',
      createdAt: new Date(),
    };

    if (existingIndex >= 0) {
      this.records[existingIndex] = record;
    } else {
      this.records.push(record);
    }

    return record;
  }

  /**
   * 获取今日收款记录
   */
  getTodayRecords(): PaymentRecord[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.records.filter(r => 
      new Date(r.createdAt) >= today && r.status === 'success'
    );
  }

  /**
   * 获取统计数据
   */
  getStats() {
    const today = this.getTodayRecords();
    
    return {
      todayTotal: today.reduce((sum, r) => sum + r.amount, 0),
      todayCount: today.length,
      wechatTotal: today.filter(r => r.paymentMethod === 'wechat')
        .reduce((sum, r) => sum + r.amount, 0),
      alipayTotal: today.filter(r => r.paymentMethod === 'alipay')
        .reduce((sum, r) => sum + r.amount, 0),
    };
  }
}

export const paymentService = new PaymentService();

/**
 * ============================================================
 * 以下是实际对接微信支付需要的步骤说明
 * ============================================================
 * 
 * 1. 申请微信支付商户号
 *    - 访问 https://pay.weixin.qq.com/
 *    - 提交营业执照、法人身份证等资料
 *    - 等待审核（通常1-5个工作日）
 * 
 * 2. 获取API密钥
 *    - 登录商户平台 -> API安全 -> 设置API密钥
 *    - 下载API证书
 * 
 * 3. 开发对接
 *    - 统一下单接口：生成预支付订单
 *    - 查询订单接口：查询支付状态
 *    - 支付通知：接收异步回调
 * 
 * 4. 测试上线
 *    - 使用沙箱环境测试
 *    - 切换生产环境上线
 * 
 * ============================================================
 * 支付宝对接步骤
 * ============================================================
 * 
 * 1. 注册开放平台账号
 *    - 访问 https://open.alipay.com/
 *    - 完成企业认证
 * 
 * 2. 创建应用
 *    - 创建网页&移动应用
 *    - 添加"当面付"功能
 * 
 * 3. 配置密钥
 *    - 生成RSA密钥对
 *    - 上传应用公钥，获取支付宝公钥
 * 
 * 4. SDK集成
 *    - 使用官方SDK或直接调用API
 *    - 实现预下单、查询、退款等功能
 */

