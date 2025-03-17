import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation types
type RootStackParamList = {
  Login: undefined;
  Signup: { isSignIn?: boolean };
  Home: undefined;
  ProfileSetup: undefined;
  ForgotPassword: undefined;
};

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;
type SignupScreenRouteProp = RouteProp<RootStackParamList, 'Signup'>;

const SignupScreen = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const route = useRoute<SignupScreenRouteProp>();
  const { signUp, signIn } = useAuth();
  
  const isSignIn = route.params?.isSignIn ?? false;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async () => {
    // Validate inputs
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    if (!isSignIn && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (!isSignIn && !fullName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isSignIn) {
        // Handle sign in
        console.log('Attempting to sign in with:', email);
        const { error, data } = await signIn(email, password);
        
        if (error) {
          console.error('Sign in error:', error);
          Alert.alert('Sign In Error', error.message);
        } else {
          console.log('Sign in successful:', data);
        }
      } else {
        // Handle sign up
        console.log('Attempting to sign up with:', email);
        const { error, data } = await signUp(email, password, fullName);
        
        if (error) {
          console.error('Sign up error:', error);
          Alert.alert('Sign Up Error', error.message);
        } else {
          console.log('Sign up response:', data);
          
          // Check if email confirmation is required
          if (data?.user?.identities?.length === 0) {
            // This means the user needs to confirm their email
            Alert.alert(
              'Account Created', 
              'Your account has been created successfully. Please check your email to verify your account.',
              [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
          } else if (data?.user) {
            // User was created and auto-confirmed (development mode)
            Alert.alert(
              'Account Created', 
              'Your account has been created successfully. You can now sign in.',
              [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
          } else {
            // Something unexpected happened
            Alert.alert(
              'Account Status Unknown', 
              'Your account may have been created, but we could not confirm its status. Please try signing in.',
              [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
          }
        }
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          
          <View style={styles.header}>
            <Text style={styles.title}>{isSignIn ? 'Sign In' : 'Create Account'}</Text>
            <Text style={styles.subtitle}>
              {isSignIn 
                ? 'Welcome back! Please sign in to continue' 
                : 'Fill in your details to get started'}
            </Text>
          </View>
          
          <View style={styles.form}>
            {!isSignIn && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.textInputContainer}>
                  <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your full name"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.textInputContainer}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.textInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {!isSignIn && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.textInputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}
            
            {isSignIn && (
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignIn ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.switchModeButton}
              onPress={() => navigation.navigate('Signup', { isSignIn: !isSignIn })}
            >
              <Text style={styles.switchModeText}>
                {isSignIn 
                  ? "Don't have an account? Sign Up" 
                  : "Already have an account? Sign In"}
              </Text>
            </TouchableOpacity>
            
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={() => {
                  // Set test values
                  setEmail('test@example.com');
                  setPassword('Password123!');
                  setConfirmPassword('Password123!');
                  setFullName('Test User');
                  Alert.alert('Debug', 'Test values filled');
                }}
              >
                <Text style={styles.debugButtonText}>Fill Test Data</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 50,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#4F8EF7',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchModeButton: {
    alignItems: 'center',
    padding: 8,
  },
  switchModeText: {
    color: '#4F8EF7',
    fontSize: 14,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#f0f7ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#4F8EF7',
  },
  debugButtonText: {
    color: '#4F8EF7',
    fontWeight: '600',
  },
  logo: {
    width: 150,
    height: 60,
    alignSelf: 'center',
    marginBottom: 24,
  },
});

export default SignupScreen; 