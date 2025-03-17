import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../lib/supabase';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { navigateToProfileSetup } from '../navigation/AppNavigator';

// Define the navigation types
type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
};

type MainTabParamList = {
  Home: undefined;
  HealthData: undefined;
  Profile: undefined;
};

// Use a more generic navigation type since we're in a nested navigator
type ProfileScreenNavigationProp = any;

const ProfileScreen = () => {
  const { user, signOut, getDebugInfo } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch profile when component mounts
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);
  
  // Refresh profile when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log('Profile screen focused, refreshing profile data');
        fetchProfile();
      }
      return () => {};
    }, [user])
  );
  
  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        
        // If the profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating default profile');
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();
            
          if (insertError) {
            console.error('Error creating default profile:', insertError);
          } else {
            console.log('Default profile created:', newProfile);
            setProfile(newProfile);
          }
        }
      } else {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };
  
  const handleEditProfile = () => {
    console.log('Attempting to navigate to EditProfile screen');
    navigation.navigate('EditProfile');
  };
  
  // Debug function to check users in the database
  const checkDatabase = async () => {
    try {
      console.log('Checking database for users...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching current user:', userError);
        Alert.alert('Error', 'Could not fetch current user');
        return;
      }
      
      console.log('Current user:', user);
      
      // Check profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        Alert.alert('Error', 'Could not fetch profiles');
        return;
      }
      
      console.log('Profiles:', profiles);
      
      Alert.alert(
        'Database Check',
        `Current user: ${user?.email || 'None'}\nFound ${profiles?.length || 0} profiles`
      );
    } catch (error) {
      console.error('Error checking database:', error);
      Alert.alert('Error', 'An error occurred while checking the database');
    }
  };
  
  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F8EF7" />
        </View>
      </SafeAreaWrapper>
    );
  }
  
  return (
    <SafeAreaWrapper>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.full_name || 'User'}
              </Text>
              <Text style={styles.profileEmail}>
                {user?.email || 'No email'}
              </Text>
              
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {profile?.bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{profile?.age || '--'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Height</Text>
              <Text style={styles.infoValue}>
                {profile?.height ? `${profile.height} cm` : '--'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>
                {profile?.weight ? `${profile.weight} kg` : '--'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="notifications-outline" size={24} color="#4F8EF7" />
            <Text style={styles.settingsText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="lock-closed-outline" size={24} color="#4F8EF7" />
            <Text style={styles.settingsText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="help-circle-outline" size={24} color="#4F8EF7" />
            <Text style={styles.settingsText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingsItem, styles.dangerItem]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
            <Text style={[styles.settingsText, styles.dangerText]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          {__DEV__ && (
            <TouchableOpacity 
              style={[styles.settingsItem, { marginTop: 20, backgroundColor: '#f0f7ff' }]}
              onPress={checkDatabase}
            >
              <Ionicons name="code-working" size={24} color="#4F8EF7" />
              <Text style={styles.settingsText}>Debug: Check Database</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
          
          {__DEV__ && (
            <TouchableOpacity 
              style={[styles.settingsItem, { marginTop: 10, backgroundColor: '#fff0f0' }]}
              onPress={async () => await supabase.auth.signOut()}
            >
              <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
              <Text style={styles.settingsText}>Debug: Clear Session</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
          
          {__DEV__ && (
            <TouchableOpacity 
              style={[styles.settingsItem, { marginTop: 10, backgroundColor: '#f0fff0' }]}
              onPress={async () => {
                try {
                  // Log navigation state
                  const navState = navigation.getState();
                  console.log('Navigation state:', JSON.stringify(navState, null, 2));
                  console.log('Available routes:', navState.routeNames);
                  
                  // Log auth state
                  const debugInfo = await getDebugInfo();
                  console.log('Auth debug info:', JSON.stringify(debugInfo, null, 2));
                  
                  // Try to navigate directly
                  Alert.alert(
                    'Debug Navigation',
                    'Choose where to navigate',
                    [
                      {
                        text: 'Try EditProfile',
                        onPress: () => {
                          navigation.navigate('EditProfile');
                        }
                      },
                      {
                        text: 'Go to MainTabs',
                        onPress: () => {
                          try {
                            // Navigate to the Main stack's MainTabs screen
                            navigation.navigate('Main', {
                              screen: 'MainTabs'
                            });
                          } catch (error) {
                            console.error('Navigation error:', error);
                            Alert.alert('Error', 'Failed to navigate to MainTabs');
                          }
                        }
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel'
                      }
                    ]
                  );
                } catch (error) {
                  console.error('Debug error:', error);
                  Alert.alert('Debug Error', 'Error during debugging');
                }
              }}
            >
              <Ionicons name="bug-outline" size={24} color="#4CAF50" />
              <Text style={styles.settingsText}>Debug: Navigation Test</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  signOutButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F8EF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#4F8EF7',
    fontSize: 14,
    fontWeight: '600',
  },
  bioContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingsText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#FF6B6B',
  },
});

export default ProfileScreen; 