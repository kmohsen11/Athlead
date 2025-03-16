import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { useHealthKit } from '../hooks/useHealthKit';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  HealthData: undefined;
};

type HealthDataScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HealthData'>;

const HealthDataScreen: React.FC = () => {
  const navigation = useNavigation<HealthDataScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const {
    healthData,
    isAuthorized,
    isLoading,
    forceRefresh,
    recordWorkout,
    deviceName
  } = useHealthKit();
  const [selectedMetric, setSelectedMetric] = useState<string>('steps');

  // Refresh data when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      forceRefresh();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await forceRefresh();
    setRefreshing(false);
  };

  // Generate chart data based on actual health data
  const heartRateData = {
    labels: ["Today"],
    datasets: [
      {
        data: healthData.heartRate ? [healthData.heartRate] : [],
        color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Heart Rate (BPM)"]
  };

  const stepsData = {
    labels: ["Today"],
    datasets: [
      {
        data: healthData.steps ? [healthData.steps] : [],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Steps"]
  };

  const caloriesData = {
    labels: ["Today"],
    datasets: [
      {
        data: healthData.activeEnergyBurned ? [healthData.activeEnergyBurned] : [],
        color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Calories Burned"]
  };

  const chartConfig = {
    backgroundGradientFrom: "#f5f5f5",
    backgroundGradientTo: "#f5f5f5",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
    }
  };

  const screenWidth = Dimensions.get("window").width - 32;

  if (!isAuthorized) {
    return (
      <View style={styles.container}>
        <View style={styles.notAuthorizedContainer}>
          <Ionicons name="watch-outline" size={80} color="#ccc" />
          <Text style={styles.notAuthorizedText}>
            Connect to Apple Health to view your health data from your Apple Watch.
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.connectButtonText}>Go Back to Connect</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F8EF7" />
          <Text style={styles.loadingText}>Loading health data...</Text>
        </View>
      </View>
    );
  }

  // Check if we have any health data
  const hasData = healthData.heartRate || healthData.steps || 
                  healthData.activeEnergyBurned || healthData.exerciseTime;

  if (!hasData) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#ccc" />
          <Text style={styles.noDataText}>
            No health data found from your Apple Watch. Make sure your watch is paired and synced with your iPhone.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={forceRefresh}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Refresh Data</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.refreshButton, { marginTop: 10, backgroundColor: '#FF9500' }]}
            onPress={recordWorkout}
          >
            <Ionicons name="fitness-outline" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Record Test Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4F8EF7']}
        />
      }
    >
      {/* Watch Info Section */}
      <View style={styles.watchInfoSection}>
        <View style={styles.watchDetails}>
          <Text style={styles.watchName}>{deviceName || 'Apple Watch'}</Text>
          <Text style={styles.watchModel}>Connected Device</Text>
          <Text style={styles.lastUpdated}>
            Last updated: {healthData.lastUpdated ? healthData.lastUpdated.toLocaleTimeString() : 'Unknown'}
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.refreshButtonText}>Refresh Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Stats Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Today's Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 0, 0, 0.1)' }]}>
              <Ionicons name="heart" size={24} color="red" />
            </View>
            <Text style={styles.statValue}>{healthData.heartRate || '--'}</Text>
            <Text style={styles.statLabel}>BPM</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
              <Ionicons name="footsteps" size={24} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>{healthData.steps ? healthData.steps.toLocaleString() : '--'}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
              <Ionicons name="flame" size={24} color="#FF9500" />
            </View>
            <Text style={styles.statValue}>{healthData.activeEnergyBurned ? Math.round(healthData.activeEnergyBurned) : '--'}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
              <Ionicons name="time" size={24} color="#34C759" />
            </View>
            <Text style={styles.statValue}>{healthData.exerciseTime ? Math.round(healthData.exerciseTime) : '--'}</Text>
            <Text style={styles.statLabel}>Active Min</Text>
          </View>
        </View>
      </View>

      {/* Heart Rate Section */}
      {healthData.heartRate && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Heart Rate</Text>
          <View style={styles.metricValueContainer}>
            <Ionicons name="heart" size={32} color="red" />
            <Text style={styles.metricValue}>{healthData.heartRate} BPM</Text>
          </View>
          <Text style={styles.metricDescription}>
            Your current heart rate is {healthData.heartRate} beats per minute.
            {healthData.heartRate < 60 ? ' This is considered a resting heart rate.' : 
             healthData.heartRate > 100 ? ' This is an elevated heart rate.' : 
             ' This is within the normal range.'}
          </Text>
        </View>
      )}

      {/* Steps Section */}
      {healthData.steps && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Steps</Text>
          <View style={styles.metricValueContainer}>
            <Ionicons name="footsteps" size={32} color="#007AFF" />
            <Text style={styles.metricValue}>{healthData.steps.toLocaleString()}</Text>
          </View>
          <Text style={styles.metricDescription}>
            You've taken {healthData.steps.toLocaleString()} steps today.
            {healthData.steps < 5000 ? ' Try to reach at least 10,000 steps for better health.' : 
             healthData.steps >= 10000 ? ' Great job! You\'ve reached the recommended daily goal.' : 
             ' You\'re on your way to reaching the recommended 10,000 steps.'}
          </Text>
        </View>
      )}

      {/* Calories Section */}
      {healthData.activeEnergyBurned && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Calories Burned</Text>
          <View style={styles.metricValueContainer}>
            <Ionicons name="flame" size={32} color="#FF9500" />
            <Text style={styles.metricValue}>{Math.round(healthData.activeEnergyBurned)} kcal</Text>
          </View>
          <Text style={styles.metricDescription}>
            You've burned {Math.round(healthData.activeEnergyBurned)} active calories today.
            {healthData.activeEnergyBurned < 200 ? ' Try to increase your activity level for better results.' : 
             healthData.activeEnergyBurned > 500 ? ' Excellent! You\'re burning a significant amount of calories.' : 
             ' You\'re making good progress with your activity level.'}
          </Text>
        </View>
      )}

      {/* Exercise Time Section */}
      {healthData.exerciseTime && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Exercise Time</Text>
          <View style={styles.metricValueContainer}>
            <Ionicons name="time" size={32} color="#34C759" />
            <Text style={styles.metricValue}>{Math.round(healthData.exerciseTime)} min</Text>
          </View>
          <Text style={styles.metricDescription}>
            You've exercised for {Math.round(healthData.exerciseTime)} minutes today.
            {healthData.exerciseTime < 15 ? ' Try to get at least 30 minutes of exercise daily.' : 
             healthData.exerciseTime >= 30 ? ' Great job! You\'ve reached the recommended daily exercise goal.' : 
             ' You\'re on your way to reaching the recommended 30 minutes of daily exercise.'}
          </Text>
        </View>
      )}

      {/* Actions Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={recordWorkout}
        >
          <Ionicons name="fitness-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Record Test Workout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#4F8EF7', marginTop: 10 }]}
          onPress={forceRefresh}
        >
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Refresh Health Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  notAuthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notAuthorizedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#4F8EF7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  watchInfoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  watchDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  watchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  watchModel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: '#4F8EF7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  metricDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default HealthDataScreen; 