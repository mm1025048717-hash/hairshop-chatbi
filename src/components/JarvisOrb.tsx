import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';

interface Props {
  isActive: boolean;
  size?: number;
}

/**
 * 贾维斯风格的语音动效球
 * 多层光环 + 脉冲 + 呼吸效果
 */
export function JarvisOrb({ isActive, size = 120 }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 始终运行的呼吸动画
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();

    if (isActive) {
      // 脉冲动画
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 旋转动画
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // 光晕呼吸
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 波纹动画 - 三层
      const waveAnimation = (anim: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      waveAnimation(wave1, 0);
      waveAnimation(wave2, 500);
      waveAnimation(wave3, 1000);
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      glowAnim.setValue(0.3);
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
    }

    return () => {
      breathe.stop();
    };
  }, [isActive]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const waveStyle = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.8],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.7, 0.3, 0],
    }),
  });

  // 不活跃时也显示静态球
  if (!isActive) {
    return null; // 由 VoiceOverlay 处理静态显示
  }

  return (
    <View style={[styles.container, { width: size * 2.5, height: size * 2.5 }]}>
      {/* 外层波纹 */}
      <Animated.View style={[styles.wave, { width: size, height: size, borderRadius: size / 2 }, waveStyle(wave1)]} />
      <Animated.View style={[styles.wave, { width: size, height: size, borderRadius: size / 2 }, waveStyle(wave2)]} />
      <Animated.View style={[styles.wave, { width: size, height: size, borderRadius: size / 2 }, waveStyle(wave3)]} />

      {/* 外圈旋转光环 */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            transform: [{ rotate }],
          },
        ]}
      />

      {/* 第二层旋转环 */}
      <Animated.View
        style={[
          styles.secondRing,
          {
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: size * 0.65,
            transform: [{ rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['360deg', '0deg'],
            }) }],
          },
        ]}
      />

      {/* 中层光晕 */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size * 0.6,
            opacity: glowAnim,
            transform: [{ scale: breatheAnim }],
          },
        ]}
      />

      {/* 核心脉冲球 */}
      <Animated.View
        style={[
          styles.core,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={[styles.coreInner, { width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 }]} />
      </Animated.View>

      {/* 装饰弧线 */}
      <Animated.View
        style={[
          styles.arc,
          {
            width: size * 1.7,
            height: size * 1.7,
            borderRadius: size * 0.85,
            transform: [{ rotate }, { rotateX: '60deg' }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#007AFF',
    borderRightColor: 'rgba(0,122,255,0.4)',
  },
  secondRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'transparent',
    borderBottomColor: 'rgba(0,122,255,0.6)',
    borderLeftColor: 'rgba(0,122,255,0.2)',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: 'rgba(0,122,255,0.12)',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 60px rgba(0,122,255,0.5), 0 0 120px rgba(0,122,255,0.3)',
    } : {
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 40,
    }),
  },
  core: {
    position: 'absolute',
    backgroundColor: 'rgba(0,122,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 40px rgba(0,122,255,0.7), inset 0 0 40px rgba(0,122,255,0.4)',
    } : {
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 25,
    }),
  },
  coreInner: {
    backgroundColor: '#007AFF',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 30px rgba(0,122,255,1)',
    } : {
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 20,
    }),
  },
  arc: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: 'rgba(0,122,255,0.6)',
  },
});
