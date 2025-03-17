import React, { useEffect, useState } from 'react';
import { NavigationContainer, LinkingOptions, NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Alert, View, StatusBar, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import AppLogo from '../components/AppLogo';

// Splash Screen
import SplashScreen from '../screens/SplashScreen';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';

// App Screens
import HomeScreen from '../screens/HomeScreen';
import HealthDataScreen from '../screens/HealthDataScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

// Auth Context
import { useAuth } from '../hooks/useAuth';

// Create a ref for the navigation container
const navigationRef = React.createRef<NavigationContainerRef<any>>();

// Function to navigate from anywhere in the app
export function navigate(name: string, params?: any) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  } else {
    console.error('Navigation ref is not set');
  }
}

// Function to navigate to ProfileSetup specifically
export function navigateToProfileSetup() {
  console.log('Navigating to ProfileSetup using global function');
  if (navigationRef.current) {
    navigationRef.current.navigate('Main', {
      screen: 'ProfileSetup'
    });
  } else {
    console.error('Navigation ref is not set');
  }
}

// Define the navigation types
type AuthStackParamList = {
  Login: undefined;
  Signup: { isSignIn?: boolean };
  ForgotPassword: undefined;
};

type MainTabParamList = {
  Home: undefined;
  HealthData: undefined;
  Profile: undefined;
};

type MainStackParamList = {
  MainTabs: undefined;
  ProfileSetup: undefined;
  EditProfile: undefined;
};

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Create the navigators
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Auth Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f5f5' }
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Main App Navigator with Tabs
const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name === 'Home',
        headerTitle: () => (
          <View>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Athlead</Text>
          </View>
        ),
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'HealthData') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F8EF7',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#eee',
          backgroundColor: '#fff',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        }
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen 
        name="HealthData" 
        component={HealthDataScreen}
        options={{ tabBarLabel: 'Health Data' }}
      />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
};

// Main Stack Navigator that includes tabs and other screens
const MainNavigator = () => {
  return (
    <MainStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        presentation: 'card'
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      <MainStack.Screen 
        name="ProfileSetup" 
        component={ProfileSetupScreen}
        options={{
          presentation: 'modal'
        }}
      />
      <MainStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          presentation: 'modal'
        }}
      />
    </MainStack.Navigator>
  );
};

// Root Navigator that switches between Auth and Main flows
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  
  // Handle deep links for auth callbacks
  useEffect(() => {
    // Function to handle incoming URLs
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      // Check if this is an auth callback URL
      if (url.includes('auth/callback')) {
        try {
          // Extract the code from the URL
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          
          if (code) {
            console.log('Found auth code, exchanging for session');
            
            // Exchange the code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              console.error('Code exchange error:', error);
              Alert.alert('Authentication Error', error.message);
            } else {
              console.log('Successfully authenticated with session');
            }
          }
        } catch (error) {
          console.error('Error processing callback:', error);
        }
      }
    };
    
    // Set up event listener for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });
    
    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App opened with URL:', url);
        handleDeepLink(url);
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Configure deep linking
  const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['com.athlead.app://', 'https://athlead.app'],
    config: {
      screens: {
        Main: {
          path: 'main',
          screens: {
            MainTabs: {
              path: 'tabs',
              screens: {
                Home: 'home',
                HealthData: 'health-data',
                Profile: 'profile',
              }
            },
            ProfileSetup: 'profile-setup',
            EditProfile: 'edit-profile'
          }
        },
        Auth: {
          path: 'auth',
          screens: {
            Login: 'login',
            Signup: 'signup',
            ForgotPassword: 'forgot-password',
          }
        }
      }
    }
  };
  
  // If still loading auth state or showing splash, show the splash screen
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <GestureHandlerRootView style={styles.container}>
          <SplashScreen onFinish={() => setShowSplash(false)} />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }
  
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <GestureHandlerRootView style={styles.container}>
        <NavigationContainer 
          ref={navigationRef}
          linking={linking}
        >
          <RootStack.Navigator 
            screenOptions={{ 
              headerShown: false,
              presentation: 'modal'
            }}
          >
            {user ? (
              <>
                <RootStack.Screen name="Main" component={MainNavigator} />
              </>
            ) : (
              <RootStack.Screen name="Auth" component={AuthNavigator} />
            )}
          </RootStack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppNavigator; 