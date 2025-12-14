# 💇‍♀️ 账掌柜 - AI智能记账助手

> 让记账变得简单，说话就能记账，聊天就能管店

## 📱 产品介绍

账掌柜是一款专为理发店等个体工商户设计的AI记账应用。通过自然语言对话，让不懂技术的小商家也能轻松管理店铺。

### ✨ 核心特点

- **🗣️ 对话式交互** - 说话就能记账，无需复杂操作
- **📊 智能统计** - 自动生成经营报表，一目了然
- **📦 库存管理** - 智能提醒补货，再也不怕断货
- **💳 支付集成** - 对接微信/支付宝，自动对账

### 🎯 目标用户

- 理发店个体户
- 美容美发行业小商家
- 中小型服务业商户

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- iOS/Android 模拟器 或 Expo Go App

### 安装依赖

```bash
npm install
```

### 启动开发服务器

**方式一：一键启动（推荐）**

双击项目根目录的 `start-dev.bat` 文件，自动启动代理服务器和 Web 应用。

**方式二：手动启动**

```bash
# 终端1：启动代理服务器（必需，用于 DeepSeek AI 通信）
npm run proxy

# 终端2：启动 Expo
npm run web
```

然后：
- 🌐 浏览器会自动打开 Web 版本
- 📱 手机扫描二维码，使用 Expo Go 打开
- 🖥️ 按 `i` 打开 iOS 模拟器
- 🤖 按 `a` 打开 Android 模拟器

> ⚠️ **注意**：Web 版本需要先启动代理服务器 (`npm run proxy`)，否则 AI 功能无法使用。

## 💬 使用示例

### 记账

```
你: 收了一个洗剪吹38块
AI: ✅ 好的，已记录收入 38元
    📋 服务项目：洗剪吹
    📊 今日累计收入：238元

你: 老李烫头收了280
AI: ✅ 已记录，老李烫头280元
    需要备注会员信息吗？

你: 买洗发水花了150
AI: ✅ 已记录支出150元
    📦 商品：洗发水
```

### 查账

```
你: 今天收入多少？
AI: 📊 今日经营数据
    💰 总收入：680元
    💸 总支出：150元
    📈 净利润：530元
    👥 接待顾客：15人

你: 这个月赚了多少？
AI: 📊 本月经营数据
    💰 总收入：18,560元
    📈 比上月增长12.5%
```

### 库存

```
你: 洗发水还剩多少？
AI: 📦 洗发水
    数量：5瓶
    状态：⚠️ 库存不足
    💡 建议尽快补货

你: 进了10瓶洗发水
AI: ✅ 已更新库存
    📦 洗发水
    • 入库：+10瓶
    • 现有：15瓶
```

## 📂 项目结构

```
├── app/                    # 页面路由 (Expo Router)
│   ├── _layout.tsx        # 根布局
│   ├── index.tsx          # 主页/对话界面
│   ├── stats.tsx          # 统计页面
│   └── settings.tsx       # 设置页面
├── src/
│   ├── components/        # UI组件
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   └── StatsCard.tsx
│   ├── services/          # 业务逻辑
│   │   ├── aiAgent.ts     # AI意图识别
│   │   ├── chatAgent.ts   # 对话处理
│   │   ├── responseGenerator.ts  # 回复生成
│   │   └── paymentService.ts     # 支付服务
│   ├── store/             # 状态管理
│   │   └── useStore.ts
│   └── types/             # TypeScript类型
│       └── index.ts
├── assets/                # 静态资源
├── PRD.md                 # 产品需求文档
└── README.md
```

## 🛠️ 技术栈

- **前端框架**: React Native + Expo
- **路由**: Expo Router
- **状态管理**: Zustand
- **存储**: AsyncStorage
- **图标**: @expo/vector-icons

## 📦 发布应用

### 构建 Android APK

```bash
eas build --platform android --profile preview
```

### 构建 iOS IPA

```bash
eas build --platform ios
```

### 提交应用商店

```bash
# Android
eas submit --platform android

# iOS
eas submit --platform ios
```

## 💳 支付接入

### 微信支付

1. 申请微信支付商户号: https://pay.weixin.qq.com/
2. 完成企业资质认证
3. 获取 API 密钥和证书
4. 配置支付参数

### 支付宝

1. 注册支付宝开放平台: https://open.alipay.com/
2. 创建应用并开通当面付
3. 配置 RSA 密钥
4. 集成 SDK

详细文档参见 `src/services/paymentService.ts`

## 📈 推广策略

### 短视频内容

1. **痛点场景** - 展示手工记账的繁琐
2. **产品演示** - 1秒语音记账
3. **用户证言** - 真实店主使用反馈
4. **教程指南** - 功能使用技巧

### 推广话术

- "理发店老板娘都在用的记账神器"
- "不用打字，说话就能记账"
- "60岁的我妈都会用的记账App"

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

💇‍♀️ **账掌柜** - 让每一位个体户都能轻松管账

*如有问题，请提交 Issue 或联系我们*

