import React from 'react';
import { Platform, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import HealthDataScreen from './src/screens/HealthDataScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WorkoutsScreen from './src/screens/WorkoutsScreen';

// Create a simple AuthContext
import { createContext, useContext, useState, useEffect } from 'react';

// Define types for our auth context
type User = {
  id: string;
  name: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: () => void;
  logout: () => void;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking if user is logged in
    setTimeout(() => {
      // For demo purposes, let's assume user is logged in
      setUser({ id: '1', name: 'Demo User' });
      setLoading(false);
    }, 1000);
  }, []);

  const login = () => {
    setUser({ id: '1', name: 'Demo User' });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Define the navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProfileScreen') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'WorkoutsScreen') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F8EF7',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStackNavigator} 
        options={{ 
          headerShown: false,
          title: 'Home'
        }} 
      />
      <Tab.Screen 
        name="WorkoutsScreen" 
        component={WorkoutsScreen} 
        options={{ 
          title: 'Workouts',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#4F8EF7',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      <Tab.Screen 
        name="ProfileScreen" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profile',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#4F8EF7',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
    </Tab.Navigator>
  );
}

// Home stack navigator
function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Athlead',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#4F8EF7',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="HealthData" 
        component={HealthDataScreen} 
        options={{
          title: 'Health Data',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#4F8EF7',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F8EF7" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {user ? (
          <MainTabs />
        ) : (
          <Stack.Navigator>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
