// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/theme';

type TabSymbolProps = {
  symbol: string;
  focused: boolean;
};

function TabSymbol({ symbol, focused }: TabSymbolProps) {
  return (
    <Text style={{
      fontSize: 18,
      color: focused ? colors.text.primary : colors.text.muted,
      textShadowColor: focused ? colors.accent.green + '66' : 'transparent',
      textShadowRadius: focused ? 6 : 0,
    }}>
      {symbol}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface.base,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          letterSpacing: 0.8,
        },
        tabBarActiveTintColor: colors.text.primary,
        tabBarInactiveTintColor: colors.text.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Log',
          tabBarIcon: ({ focused }) => <TabSymbol symbol="◉" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabSymbol symbol="≡" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => <TabSymbol symbol="◈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarIcon: ({ focused }) => <TabSymbol symbol="∿" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabSymbol symbol="⊙" focused={focused} />,
        }}
      />
    </Tabs>
  );
}