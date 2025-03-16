import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../App';

const LoginScreen = () => {
  const { login } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Athlead</Text>
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

        <TouchableOpacity style={styles.loginButton} onPress={login}>
          <Text style={styles.loginButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#4F8EF7',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  loginButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default LoginScreen; 