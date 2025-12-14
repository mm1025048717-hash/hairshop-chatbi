import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { Colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.card,
          },
          headerTintColor: Colors.blue,
          headerTitleStyle: {
            fontWeight: '700',
            color: Colors.text,
          },
          contentStyle: {
            backgroundColor: Colors.bg,
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="stats" 
          options={{
            title: '数据统计',
            presentation: Platform.OS === 'web' ? 'card' : 'modal',
          }}
        />
        <Stack.Screen 
          name="settings" 
          options={{
            title: '设置',
            presentation: Platform.OS === 'web' ? 'card' : 'modal',
          }}
        />
      </Stack>
    </View>
  );
}
