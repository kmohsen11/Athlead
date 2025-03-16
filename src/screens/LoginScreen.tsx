import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { AntDesign } from '@expo/vector-icons';

const LoginScreen = () => {
  const { signInWithGoogle, loading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign-in...');
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        console.error('Error signing in with Google:', error.message);
      } else if (data?.session) {
        console.log('Sign-in successful with session:', data.session.user.email);
      } else {
        console.log('Sign-in process completed but no session returned');
      }
    } catch (error) {
      console.error('Error in handleGoogleSignIn:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Athlead</Text>
        <Text style={styles.subtitle}>Track your muscle activity and improve your performance</Text>
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        <AntDesign name="google" size={24} color="#DB4437" style={styles.googleIcon} />
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 30,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default LoginScreen; 