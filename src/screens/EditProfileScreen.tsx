import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

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

const EditProfileScreen = () => {
  const navigation = useNavigation();
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
        setAge(data.age ? data.age.toString() : '');
        setWeight(data.weight ? data.weight.toString() : '');
        setHeight(data.height ? data.height.toString() : '');
        setFitnessLevel(data.fitness_level || '');
        setSelectedGoals(data.goals || []);
        setSelectedActivities(data.preferred_activities || []);
        setAvatarUrl(data.avatar_url || user?.user_metadata?.avatar_url || null);
      }
    } catch (error) {
      console.error('Unexpected error loading profile data:', error);
    } finally {
      setInitialLoading(false);
    }
  };
  
  // Save profile data
  const saveProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update your profile');
      return;
    }
    
    if (!fullName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    setLoading(true);
    
    try {
      // Update the profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          bio: bio,
          age: age ? parseInt(age) : null,
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
          fitness_level: fitnessLevel,
          goals: selectedGoals.length > 0 ? selectedGoals : null,
          preferred_activities: selectedActivities.length > 0 ? selectedActivities : null,
          avatar_url: avatarUrl,
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
              navigation.goBack();
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
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity 
            style={styles.saveIconButton}
            onPress={saveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#4F8EF7" />
            ) : (
              <Ionicons name="checkmark" size={24} color="#4F8EF7" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.avatar}
                onError={() => {
                  // If image fails to load, use a default avatar
                  setAvatarUrl(null);
                }}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
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
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 0,
    paddingBottom: 120, // Increased padding to account for larger bottom bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 100,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  saveIconButton: {
    padding: 8,
    borderRadius: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4F8EF7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#4F8EF7',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fcfcfc',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 1000,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#4F8EF7',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#4F8EF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default EditProfileScreen; 