import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateCVScreen from './src/screens/CreateCVScreen';
import PhotoScreen from './src/screens/PhotoScreen';
import JobBoardScreen from './src/screens/JobBoardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AIChatBubble from './src/components/AIChatBubble';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// SVG-style tab icons using pure text (renders perfectly on web + mobile)
function TabIcon({ label, focused }) {
  const icons = {
    Inicio: '⌂',
    MiCV: '◎',
    Foto: '◉',
    Empleos: '▦',
    Historial: '↗',
  };
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{
        fontSize: 22,
        color: focused ? '#FF6B35' : '#5a6478',
        fontWeight: focused ? '900' : '400',
      }}>{icons[label] || '●'}</Text>
    </View>
  );
}

function MainTabs({ onLogout }) {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#0B0E17',
            borderTopColor: 'rgba(255,107,53,0.3)',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: '#FF6B35',
          tabBarInactiveTintColor: '#5a6478',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: -2 },
          headerStyle: { backgroundColor: '#0B0E17', shadowColor: 'transparent' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '800' },
        }}
      >
        <Tab.Screen 
          name="Inicio" 
          component={HomeScreen}
          options={{ 
            headerShown: false,
            tabBarLabel: 'Inicio',
            tabBarIcon: ({ focused }) => <TabIcon label="Inicio" focused={focused} />,
          }}
        />
        <Tab.Screen 
          name="MiCV" 
          component={CreateCVScreen}
          options={{ 
            title: 'Mi CV',
            tabBarLabel: 'CV',
            tabBarIcon: ({ focused }) => <TabIcon label="MiCV" focused={focused} />,
          }}
        />
        <Tab.Screen 
          name="Foto"
          component={PhotoScreen}
          options={{ 
            title: 'Mi Foto',
            tabBarLabel: 'Foto',
            tabBarIcon: ({ focused }) => <TabIcon label="Foto" focused={focused} />,
          }}
        />
        <Tab.Screen 
          name="Empleos" 
          component={JobBoardScreen}
          options={{ 
            tabBarLabel: 'Empleos',
            tabBarIcon: ({ focused }) => <TabIcon label="Empleos" focused={focused} />,
          }}
        />
        <Tab.Screen 
          name="Historial" 
          component={HistoryScreen}
          options={{ 
            tabBarLabel: 'Enviados',
            tabBarIcon: ({ focused }) => <TabIcon label="Historial" focused={focused} />,
          }}
        />
      </Tab.Navigator>
      <AIChatBubble />
    </View>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setIsLoggedIn(false);
  };

  if (isLoggedIn === null) return null;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0B0E17' },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: '#0B0E17' }
        }}
      >
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {(props) => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
            </Stack.Screen>
            <Stack.Screen name="Register" options={{ headerShown: false }}>
              {(props) => <RegisterScreen {...props} onRegister={() => setIsLoggedIn(true)} />}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Main" options={{ headerShown: false }}>
            {(props) => <MainTabs {...props} onLogout={handleLogout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
