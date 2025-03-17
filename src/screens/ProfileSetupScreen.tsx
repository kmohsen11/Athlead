import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { supabase } from '../lib/supabase';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { navigate } from '../navigation/AppNavigator';

// Use a more generic navigation type
type ProfileSetupScreenNavigationProp = any;

// Fitness level options
const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Fitness goals options
const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Endurance',
  'Flexibility',
  'Strength',
  'Overall Health'
];

// Preferred activities options
const PREFERRED_ACTIVITIES = [
  'Running',
  'Cycling',
  'Swimming',
  'Weightlifting',
  'Yoga',
  'HIIT',
  'Team Sports'
];

const ProfileSetupScreen = () => {
  const navigation = useNavigation<ProfileSetupScreenNavigationProp>();
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Load existing profile data when component mounts
  useEffect(() => {
    if (user) {
      loadProfileData();
    } else {
      setInitialLoading(false);
    }
  }, [user]);
  
  // Load existing profile data
  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      setInitialLoading(true);
      console.log('Loading profile data for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error loading profile data:', error);
      } else if (data) {
        console.log('Profile data loaded:', data);
        // Set form values from profile data
        setFullName(data.full_name || '');
        setBio(data.bio || '');
        
        // Set physical information fields
        setAge(data.age ? data.age.toString() : '');
        setWeight(data.weight ? data.weight.toString() : '');
        setHeight(data.height ? data.height.toString() : '');
        
        setFitnessLevel(data.fitness_level || '');
        setSelectedGoals(data.goals || []);
        setSelectedActivities(data.preferred_activities || []);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Unexpected error loading profile data:', error);
    } finally {
      setInitialLoading(false);
    }
  };
  
  // Request permissions when component mounts
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        // Request camera permissions
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus.status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos');
        }
        
        // Request media library permissions
        const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryStatus.status !== 'granted') {
          Alert.alert('Permission needed', 'Media library permission is required to select photos');
        }
      }
    })();
  }, []);
  
  // Pick an image from the library
  const pickImage = async () => {
    try {
      // Show options for avatar selection
      Alert.alert(
        'Select Profile Picture',
        'Choose a profile picture source:',
        [
          {
            text: 'Use Name Initial',
            onPress: () => {
              const nameAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName || 'User') + '&background=4F8EF7&color=fff';
              console.log('Using name avatar:', nameAvatar);
              setAvatarUrl(nameAvatar);
            }
          },
          {
            text: 'Take Photo',
            onPress: async () => {
              try {
                // For iOS, use expo-image-picker
                if (Platform.OS === 'ios') {
                  const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 1,
                  });
                  
                  console.log('Camera result:', result);
                  
                  if (!result.canceled && result.assets && result.assets.length > 0) {
                    const selectedImage = result.assets[0].uri;
                    console.log('Photo taken with Expo:', selectedImage);
                    setAvatarUrl(selectedImage);
                  }
                } 
                // For Android, use react-native-image-picker
                else {
                  const options = {
                    mediaType: 'photo' as const,
                    quality: 1 as const,
                    includeBase64: false,
                    saveToPhotos: true,
                  };

                  launchCamera(options, (response: any) => {
                    console.log('Camera response:', response);
                    
                    if (response.didCancel) {
                      console.log('User cancelled camera');
                    } else if (response.errorCode) {
                      console.error('Camera Error: ', response.errorMessage);
                      Alert.alert('Error', 'Failed to take photo. Please try again.');
                    } else if (response.assets && response.assets.length > 0) {
                      const selectedImage = response.assets[0].uri;
                      if (selectedImage) {
                        console.log('Photo taken:', selectedImage);
                        setAvatarUrl(selectedImage);
                      }
                    }
                  });
                }
              } catch (error) {
                console.error('Error taking photo:', error);
                Alert.alert('Error', 'Failed to take photo. Please try again.');
              }
            }
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              try {
                // For iOS, use expo-image-picker
                if (Platform.OS === 'ios') {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 1,
                  });
                  
                  console.log('Library result:', result);
                  
                  if (!result.canceled && result.assets && result.assets.length > 0) {
                    const selectedImage = result.assets[0].uri;
                    console.log('Image selected with Expo:', selectedImage);
                    setAvatarUrl(selectedImage);
                  }
                } 
                // For Android, use react-native-image-picker
                else {
                  const options = {
                    mediaType: 'photo' as const,
                    quality: 1 as const,
                    includeBase64: false,
                  };

                  launchImageLibrary(options, (response: any) => {
                    console.log('Library response:', response);
                    
                    if (response.didCancel) {
                      console.log('User cancelled image picker');
                    } else if (response.errorCode) {
                      console.error('ImagePicker Error: ', response.errorMessage);
                      Alert.alert('Error', 'Failed to pick image. Please try again.');
                    } else if (response.assets && response.assets.length > 0) {
                      const selectedImage = response.assets[0].uri;
                      if (selectedImage) {
                        console.log('Image selected:', selectedImage);
                        setAvatarUrl(selectedImage);
                      }
                    }
                  });
                }
              } catch (error) {
                console.error('Error picking image:', error);
                Alert.alert('Error', 'Failed to pick image. Please try again.');
              }
            }
          },
          ...(user?.user_metadata?.avatar_url ? [{
            text: 'Use Google Avatar',
            onPress: () => {
              console.log('Using Google avatar:', user.user_metadata.avatar_url);
              setAvatarUrl(user.user_metadata.avatar_url);
            }
          }] : []),
          {
            text: 'No Avatar',
            style: 'destructive' as const,
            onPress: () => {
              console.log('Clearing avatar');
              setAvatarUrl(null);
            }
          },
          { text: 'Cancel', style: 'cancel' as const }
        ]
      );
    } catch (error) {
      console.error('Error in avatar selection:', error);
      Alert.alert('Error', 'Failed to set avatar. Please try again.');
    }
  };
  
  // Upload image to Supabase Storage
  const uploadAvatar = async () => {
    if (!avatarUrl || !user) {
      console.log('No avatar URL or user to upload');
      return null;
    }
    
    // If the avatar URL is already a remote URL (Supabase or Google), return it
    if (avatarUrl.startsWith('http') && (avatarUrl.includes('supabase') || avatarUrl.includes('googleusercontent'))) {
      console.log('Avatar is already a remote URL, skipping upload');
      return avatarUrl;
    }
    
    try {
      setUploading(true);
      console.log('Starting avatar upload process');
      
      // For local file URIs, we would normally upload to Supabase storage
      // But for now, we'll just use the local URI directly
      // In a production app, you would implement the actual upload
      
      // For demonstration purposes, we'll just log that we would upload the file
      console.log('Would upload local file:', avatarUrl);
      
      // Return the local URI for now
      // In a production app, this would be the URL of the uploaded file
      return avatarUrl;
      
      /* 
      // ACTUAL UPLOAD IMPLEMENTATION - UNCOMMENT WHEN READY
      // This is the code that would actually upload the image to Supabase storage
      
      // Convert image URI to Blob
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      
      // Generate a unique file path
      const fileExt = avatarUrl.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob);
        
      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }
      
      // Get public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
      */
    } catch (error) {
      console.error('Error handling avatar:', error);
      // Don't show an error to the user, just use null
      return null;
    } finally {
      setUploading(false);
    }
  };
  
  // Save profile data
  const saveProfile = async () => {
    setLoading(true);
    
    try {
      // Prepare the profile data
      const profileData = {
        full_name: fullName,
        age: parseInt(age),
        height: parseInt(height),
        weight: parseInt(weight),
        fitness_level: fitnessLevel,
        goals: selectedGoals,
        preferred_activities: selectedActivities,
        bio: bio,
        avatar_url: avatarUrl || user?.user_metadata?.avatar_url || null,
      };
      
      console.log('Saving profile data:', profileData);
      
      // Update the profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .select();
      
      setLoading(false);
      
      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile: ' + error.message);
        return;
      }
      
      console.log('Profile updated successfully:', data);
      
      // Show success message and navigate back
      Alert.alert(
        'Success',
        'Your profile has been updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              try {
                // Try to navigate back to the previous screen
                navigation.goBack();
              } catch (error) {
                console.error('Navigation error when going back:', error);
                // If that fails, try to navigate to the Main tabs
                try {
                  navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'Profile' } });
                } catch (error2) {
                  console.error('Second navigation attempt failed:', error2);
                  // Last resort - use the navigation ref to reset
                  Alert.alert('Navigation Error', 'Unable to return to the profile screen. Please restart the app.');
                }
              }
            }
          }
        ]
      );
    } catch (error) {
      setLoading(false);
      console.error('Unexpected error updating profile:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };
  
  if (initialLoading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F8EF7" />
          <Text style={styles.loadingText}>Loading profile data...</Text>
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            style={styles.avatarWrapper} 
            onPress={() => {
              try {
                console.log('Avatar button pressed');
                pickImage();
              } catch (error) {
                console.error('Error in avatar button press handler:', error);
                Alert.alert('Error', 'Something went wrong. Please try again.');
              }
            }}
          >
            {avatarUrl ? (
              <View style={styles.avatarImageContainer}>
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={styles.avatar} 
                  onError={(e) => {
                    console.error('Image loading error:', e.nativeEvent.error);
                    // If image fails to load, use a default avatar
                    if (user?.user_metadata?.avatar_url) {
                      setAvatarUrl(user.user_metadata.avatar_url);
                    } else {
                      // Use name-based avatar as fallback
                      const nameAvatar = 'https://ui-avatars.com/api/?name=' + 
                        encodeURIComponent(fullName || 'User') + '&background=4F8EF7&color=fff';
                      setAvatarUrl(nameAvatar);
                    }
                  }}
                />
                {uploading && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#ccc" />
              </View>
            )}
            <View style={styles.avatarEditButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarText}>Add Profile Picture</Text>
        </View>
        
        <View style={styles.form}>
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
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bio</Text>
            <Text style={styles.inputDescription}>Share a little about yourself, your fitness goals, or interests</Text>
            <View style={[styles.textInputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Tell us about yourself"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <Text style={styles.sectionTitle}>Physical Information</Text>
          
          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Age</Text>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Years"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Weight</Text>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="kg"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Height</Text>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="cm"
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fitness Level</Text>
            <View style={styles.fitnessLevelContainer}>
              {FITNESS_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.fitnessLevelButton,
                    fitnessLevel === level && styles.fitnessLevelButtonSelected
                  ]}
                  onPress={() => setFitnessLevel(level)}
                >
                  <Text
                    style={[
                      styles.fitnessLevelText,
                      fitnessLevel === level && styles.fitnessLevelTextSelected
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fitness Goals</Text>
            <Text style={styles.inputDescription}>Select all that apply</Text>
            <View style={styles.tagsContainer}>
              {FITNESS_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.tagButton,
                    selectedGoals.includes(goal) && styles.tagButtonSelected
                  ]}
                  onPress={() => {
                    if (selectedGoals.includes(goal)) {
                      setSelectedGoals(selectedGoals.filter(g => g !== goal));
                    } else {
                      setSelectedGoals([...selectedGoals, goal]);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedGoals.includes(goal) && styles.tagTextSelected
                    ]}
                  >
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Preferred Activities</Text>
            <Text style={styles.inputDescription}>Select all that apply</Text>
            <View style={styles.tagsContainer}>
              {PREFERRED_ACTIVITIES.map((activity) => (
                <TouchableOpacity
                  key={activity}
                  style={[
                    styles.tagButton,
                    selectedActivities.includes(activity) && styles.tagButtonSelected
                  ]}
                  onPress={() => {
                    if (selectedActivities.includes(activity)) {
                      setSelectedActivities(selectedActivities.filter(a => a !== activity));
                    } else {
                      setSelectedActivities([...selectedActivities, activity]);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedActivities.includes(activity) && styles.tagTextSelected
                    ]}
                  >
                    {activity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveProfile}
            disabled={loading || uploading}
          >
            {loading || uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => {
              console.log('Skipping profile setup, navigating back');
              try {
                // First try to go back
                navigation.goBack();
              } catch (error) {
                console.error('Error navigating back:', error);
                
                // If going back fails, try to navigate to Main stack's MainTabs screen with Profile tab
                try {
                  navigation.navigate('Main', {
                    screen: 'MainTabs',
                    params: {
                      screen: 'Profile'
                    }
                  });
                } catch (navError) {
                  console.error('Navigation to MainTabs error:', navError);
                  Alert.alert('Navigation Error', 'Could not navigate back. Please restart the app.');
                }
              }
            }}
            disabled={loading || uploading}
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerRight: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  avatarImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F8EF7',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 14,
    color: '#666',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  inputDescription: {
    fontSize: 12,
    color: '#666',
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
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
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
  textArea: {
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: 8,
  },
  fitnessLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fitnessLevelButton: {
    padding: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 10,
  },
  fitnessLevelButtonSelected: {
    borderColor: '#4F8EF7',
  },
  fitnessLevelText: {
    fontSize: 14,
    color: '#666',
  },
  fitnessLevelTextSelected: {
    fontWeight: 'bold',
    color: '#4F8EF7',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  tagButtonSelected: {
    borderColor: '#4F8EF7',
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  tagTextSelected: {
    fontWeight: 'bold',
    color: '#4F8EF7',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default ProfileSetupScreen; 