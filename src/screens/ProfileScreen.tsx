import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock user data
const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
  stats: {
    workouts: 12,
    thisWeek: 3,
    streak: 5,
  },
  bodyMetrics: {
    height: 180, // cm
    weight: 75, // kg
    age: 28,
  },
  goals: [
    'Build muscle strength',
    'Improve endurance',
    'Better posture',
  ],
};

const ProfileScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [healthKitEnabled, setHealthKitEnabled] = useState(true);
  const [emgSensorEnabled, setEmgSensorEnabled] = useState(true);

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: mockUser.profileImage }} 
            style={styles.profileImage} 
          />
          <Text style={styles.userName}>{mockUser.name}</Text>
          <Text style={styles.userEmail}>{mockUser.email}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockUser.stats.workouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockUser.stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockUser.stats.streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Body Metrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Metrics</Text>
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{mockUser.bodyMetrics.height} cm</Text>
              <Text style={styles.metricLabel}>Height</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{mockUser.bodyMetrics.weight} kg</Text>
              <Text style={styles.metricLabel}>Weight</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{mockUser.bodyMetrics.age}</Text>
              <Text style={styles.metricLabel}>Age</Text>
            </View>
            <TouchableOpacity style={[styles.metricItem, styles.updateMetricsButton]}>
              <Ionicons name="pencil" size={20} color="#fff" />
              <Text style={styles.updateMetricsText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Goals</Text>
          {mockUser.goals.map((goal, index) => (
            <View key={index} style={styles.goalItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4F8EF7" />
              <Text style={styles.goalText}>{goal}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.addGoalButton}>
            <Ionicons name="add-circle-outline" size={20} color="#4F8EF7" />
            <Text style={styles.addGoalText}>Add New Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={20} color="#666" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#4F8EF7' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={20} color="#666" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
              thumbColor={darkModeEnabled ? '#4F8EF7' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="heart-outline" size={20} color="#666" />
              <Text style={styles.settingText}>Apple Health</Text>
            </View>
            <Switch
              value={healthKitEnabled}
              onValueChange={setHealthKitEnabled}
              trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
              thumbColor={healthKitEnabled ? '#4F8EF7' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="bluetooth-outline" size={20} color="#666" />
              <Text style={styles.settingText}>EMG Sensor</Text>
            </View>
            <Switch
              value={emgSensorEnabled}
              onValueChange={setEmgSensorEnabled}
              trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
              thumbColor={emgSensorEnabled ? '#4F8EF7' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F8EF7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#eee',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
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
    marginBottom: 16,
    color: '#333',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  updateMetricsButton: {
    backgroundColor: '#4F8EF7',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  updateMetricsText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addGoalText: {
    marginLeft: 8,
    color: '#4F8EF7',
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ProfileScreen; 