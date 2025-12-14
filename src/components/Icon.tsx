import React from 'react';
import { Text, Platform } from 'react-native';

// Web 端使用 emoji 或文字替代图标
const iconMap: Record<string, string> = {
  'bar-chart-outline': '📊',
  'settings-outline': '⚙️',
  'send': '➤',
  'flash-outline': '⚡',
  'people-outline': '👥',
  'people': '👥',
  'arrow-down-outline': '↓',
  'arrow-down': '↓',
  'arrow-up': '↑',
  'chevron-forward': '›',
  'receipt-outline': '📋',
  'receipt': '📋',
  'storefront-outline': '🏪',
  'location-outline': '📍',
  'call-outline': '📞',
  'logo-wechat': '💬',
  'logo-alipay': '💳',
  'qr-code-outline': '📱',
  'cloud-upload-outline': '☁️',
  'download-outline': '⬇️',
  'trash-outline': '🗑️',
  'information-circle-outline': 'ℹ️',
  'star-outline': '⭐',
  'help-circle-outline': '❓',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

// 简单的图标组件，Web端使用emoji
export function Icon({ name, size = 24, color = '#fff' }: IconProps) {
  const emoji = iconMap[name] || '•';
  
  if (Platform.OS === 'web') {
    return (
      <Text style={{ fontSize: size * 0.8, lineHeight: size }}>
        {emoji}
      </Text>
    );
  }
  
  // 在原生端，尝试加载 Ionicons
  try {
    const { Ionicons } = require('@expo/vector-icons');
    return <Ionicons name={name as any} size={size} color={color} />;
  } catch {
    return (
      <Text style={{ fontSize: size * 0.8, color, lineHeight: size }}>
        {emoji}
      </Text>
    );
  }
}

