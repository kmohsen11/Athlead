import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Navigation } from './src/navigation';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

export default function App() {
  // Set up linking configuration
  const linking = {
    prefixes: [
      Linking.createURL('/'),
      'athlead://',
      // Add your authentication redirect URIs here
    ],
    config: {
      screens: {
        // Define your screens mapping here
        // Example:
        Home: 'home',
        Login: 'login',
        // Add other screens as needed
      },
    },
  };

  return (
    <SafeAreaProvider>
      <Navigation linking={linking} />
    </SafeAreaProvider>
  );
}
