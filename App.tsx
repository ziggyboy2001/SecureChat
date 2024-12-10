import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider } from '@rneui/themed';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useAuth } from './context/AuthContext';
import { API_URL } from './config';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ChatsScreen from './screens/ChatsScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import SearchScreen from './screens/SearchScreen';
import UnderDuressSettingsScreen from './screens/UnderDuressSettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, TabParamList } from './types/navigation';
import { navigationTheme, colors, typography } from './theme';
import { TouchableOpacity, Text, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const UnderDuressButton = () => {
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleUnderDuress = async () => {
    try {
      console.log('Attempting to switch to duress account...');
      const response = await fetch(`${API_URL}/auth/switch-to-duress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();
      console.log('Server response:', { status: response.status, data });

      if (!response.ok) {
        if (response.status === 500) {
          Alert.alert(
            'No Under Duress Account',
            'Would you like to set up an under duress account now?',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Set Up',
                onPress: () => navigation.navigate('UnderDuressSettings')
              }
            ]
          );
          return;
        }
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      // Clear existing auth data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      // Get new auth data
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Reload the app
      if (Platform.OS === 'web') {
        window.location.reload();
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (error) {
      console.error('Detailed error:', error);
      if (error instanceof Error) {
        Alert.alert(
          'Error',
          `Failed to switch accounts: ${error.message}`
        );
      } else {
        Alert.alert(
          'Error',
          'An unexpected error occurred. Please try again later.'
        );
      }
    }
  };

  return (
    <TouchableOpacity onPress={handleUnderDuress}>
      <Text style={{ color: colors.text.inverse, fontSize: 16 }}>
        Under Duress
      </Text>
    </TouchableOpacity>
  );
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'chatbubbles';

        if (route.name === 'Chats') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else if (route.name === 'Search') {
          iconName = focused ? 'search' : 'search-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Chats" component={ChatsScreen} />
    <Tab.Screen name="Search" component={SearchScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default function App() {
  return (
    <Provider>
      <ThemeProvider>
        <SafeAreaProvider>
          <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: colors.background.primary,
                },
                headerTintColor: colors.text.inverse,
                headerTitleStyle: {
                  fontSize: typography.h4.fontSize,
                  fontWeight: '700',
                },
              }}
            >
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={({ route }) => ({ 
                  title: route.params.username,
                  headerBackTitle: 'Back',
                  headerRight: () => <UnderDuressButton />,
                })}
              />
              <Stack.Screen
                name="UnderDuressSettings"
                component={UnderDuressSettingsScreen}
                options={{
                  title: 'Under Duress Settings',
                  headerBackTitle: 'Back'
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}
