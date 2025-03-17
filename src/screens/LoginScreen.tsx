import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AppLogo from '../components/AppLogo';

// Define the navigation types
type RootStackParamList = {
  Login: undefined;
  Signup: { isSignIn?: boolean };
  Home: undefined;
  ProfileSetup: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const { signIn, signInWithGoogle, getDebugInfo } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google sign-in error:', error);
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
    }
  };

  const handleEmailSignIn = () => {
    // Navigate to email sign in screen
    navigation.navigate('Signup', { isSignIn: false });
  };

  const handleDebug = async () => {
    try {
      const debugInfo = await getDebugInfo();
      console.log('Auth debug info:', JSON.stringify(debugInfo, null, 2));
      
      Alert.alert(
        'Auth Debug Info',
        `Auth status: ${debugInfo.authStatus?.isAuthenticated ? 'Authenticated' : 'Not authenticated'}\n` +
        `User: ${debugInfo.authStatus?.email || 'None'}`
      );
    } catch (error) {
      console.error('Error in debug handler:', error);
      Alert.alert('Error', 'An error occurred while debugging');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <AppLogo />
            <Text style={styles.tagline}>Your Personal Health & Fitness Companion</Text>
          </View>

          <View style={styles.featureContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="watch-outline" size={32} color="#4F8EF7" />
              <Text style={styles.featureTitle}>Apple Watch Integration</Text>
              <Text style={styles.featureDescription}>
                Connect with your Apple Watch to track health metrics in real-time
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="analytics-outline" size={32} color="#4F8EF7" />
              <Text style={styles.featureTitle}>Detailed Analytics</Text>
              <Text style={styles.featureDescription}>
                Get insights into your health data with comprehensive analytics
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="fitness-outline" size={32} color="#4F8EF7" />
              <Text style={styles.featureTitle}>Workout Tracking</Text>
              <Text style={styles.featureDescription}>
                Record and analyze your workouts to improve performance
              </Text>
            </View>
          </View>

          <View style={styles.authButtonsContainer}>
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
              <Ionicons name="logo-google" size={20} color="#4F8EF7" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.emailButton} onPress={handleEmailSignIn}>
              <Ionicons name="mail-outline" size={20} color="#fff" />
              <Text style={styles.emailButtonText}>Sign up with Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signInLink}
              onPress={() => navigation.navigate('Signup', { isSignIn: true })}
            >
              <Text style={styles.signInLinkText}>
                Already have an account? <Text style={styles.signInLinkTextBold}>Sign in</Text>
              </Text>
            </TouchableOpacity>
            
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={handleDebug}
              >
                <Ionicons name="code-working" size={20} color="#4F8EF7" />
                <Text style={styles.debugButtonText}>Debug Auth</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  logoImage: {
    width: 180,
    height: 80,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  featureContainer: {
    marginVertical: 40,
  },
  featureItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  authButtonsContainer: {
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  emailButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  signInLink: {
    alignItems: 'center',
    padding: 8,
  },
  signInLinkText: {
    color: '#666',
    fontSize: 14,
  },
  signInLinkTextBold: {
    fontWeight: 'bold',
    color: '#4F8EF7',
  },
  debugButton: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#4F8EF7',
  },
  debugButtonText: {
    color: '#4F8EF7',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default LoginScreen; 