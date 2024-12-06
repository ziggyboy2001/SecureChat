import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider } from '@rneui/themed';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ChatsScreen from './screens/ChatsScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import SearchScreen from './screens/SearchScreen';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, TabParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

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
      tabBarActiveTintColor: '#007AFF',
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
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#007AFF',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
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
                  headerBackTitle: 'Back'
                })}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}
