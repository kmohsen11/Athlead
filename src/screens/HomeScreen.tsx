import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, AlertButton, RefreshControl, Linking, SafeAreaView, Modal, StatusBar } from 'react-native';
import useBLE, { SERVICE_UUID, TARGET_DEVICE_UUID, CHARACTERISTIC_UUID } from '../utils/ble';
import { useHealthKit, HealthData } from '../hooks/useHealthKit';
import { Ionicons } from '@expo/vector-icons';
import { Device } from 'react-native-ble-plx';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

// Define the navigation types
type RootStackParamList = {
  Home: undefined;
  HealthData: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { 
    healthData, 
    deviceName, 
    forceRefresh, 
    recordWorkout, 
    requestHealthKitPermissions,
    isLoading: isHealthKitLoading,
    isAuthorized: isHealthKitAuthorized
  } = useHealthKit();
  
  const [refreshing, setRefreshing] = useState(false);
  const { 
    isScanning, 
    isConnected, 
    connectToDevice, 
    disconnectFromDevice,
    emgData,
    scanForPeripherals,
    stopScanningPeripherals,
    allScannedDevices,
    requestPermissions,
    connectedDevice
  } = useBLE();

  const [emgDataPoints, setEmgDataPoints] = useState<number[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // Update EMG data when it changes
  useEffect(() => {
    if (emgData.length > 0) {
      setEmgDataPoints(emgData);
    }
  }, [emgData]);

  // Close the device selection modal when a device is connected
  useEffect(() => {
    if (isConnected && connectedDevice) {
      setShowDeviceModal(false);
    }
  }, [isConnected, connectedDevice]);

  // Periodically refresh health data when authorized
  useEffect(() => {
    if (!isHealthKitAuthorized) return;
    
    // Fetch data immediately
    forceRefresh();
    
    // Set up interval to refresh data every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('=== SCHEDULED 30-SECOND REFRESH ===');
      forceRefresh();
    }, 30000); // Exactly 30 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, [isHealthKitAuthorized]);

  const onRefresh = async () => {
    setRefreshing(true);
    await forceRefresh();
    setRefreshing(false);
  };

  const handleConnectPress = async () => {
    if (isConnected && connectedDevice) {
      await disconnectFromDevice();
    } else {
      // Request permissions before scanning
      const permissionGranted = await requestPermissions();
      if (!permissionGranted) {
        Alert.alert('Permission Error', 'Bluetooth permissions are required');
        return;
      }
      
      // Show the device selection modal
      setShowDeviceModal(true);
      
      // Start scanning for devices
      Alert.alert(
        'Scanning for EMG Sensors',
        'Searching for nearby EMG sensors...',
        [{ text: 'OK' }]
      );
      
      scanForPeripherals();
    }
  };

  const handleAppleWatchConnect = () => {
    requestHealthKitPermissions();
  };

  const handleDeviceConnection = async (device: Device) => {
    try {
      const result = await connectToDevice(device);
      if (result.success) {
        Alert.alert("Connected", `Successfully connected to ${result.deviceName || 'EMG sensor'}`);
        setShowDeviceModal(false);
      } else {
        Alert.alert("Connection Failed", result.error || "Failed to connect to the device");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred while connecting");
      console.error(error);
    }
  };

  // Sort devices to prioritize the target device
  const sortedDevices = [...allScannedDevices].sort((a, b) => {
    // Put target device first
    if (a.id === TARGET_DEVICE_UUID) return -1;
    if (b.id === TARGET_DEVICE_UUID) return 1;
    
    // Then sort by name (devices with names first)
    if (a.name && !b.name) return -1;
    if (!a.name && b.name) return 1;
    
    // Then alphabetically by name
    return (a.name || '').localeCompare(b.name || '');
  });

  // Device selection modal
  const renderDeviceSelectionModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDeviceModal}
        onRequestClose={() => {
          stopScanningPeripherals();
          setShowDeviceModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select EMG Sensor</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  stopScanningPeripherals();
                  setShowDeviceModal(false);
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {isScanning && (
              <View style={styles.scanningIndicator}>
                <ActivityIndicator size="small" color="#4F8EF7" />
                <Text style={styles.scanningText}>Scanning for devices...</Text>
              </View>
            )}
            
            {sortedDevices.length > 0 ? (
              <ScrollView style={styles.deviceList}>
                {sortedDevices.map((device) => (
                  <TouchableOpacity
                    key={device.id}
                    style={[
                      styles.deviceItem,
                      device.id === TARGET_DEVICE_UUID && styles.targetDeviceItem
                    ]}
                    onPress={() => handleDeviceConnection(device)}
                  >
                    <View style={styles.deviceItemContent}>
                      <Ionicons
                        name="bluetooth"
                        size={16}
                        color={device.id === TARGET_DEVICE_UUID ? "#4F8EF7" : "#666"}
                      />
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>
                          {device.id === TARGET_DEVICE_UUID && "✓ "}
                          {device.name || "Unknown Device"}
                        </Text>
                        <Text style={styles.deviceId}>{device.id}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#ccc" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noDevicesContainer}>
                <Ionicons name="bluetooth-outline" size={40} color="#ccc" />
                <Text style={styles.noDevicesText}>
                  {isScanning ? "Searching for devices..." : "No devices found"}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                stopScanningPeripherals();
                scanForPeripherals();
              }}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="refresh-outline" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaWrapper>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F8EF7']}
          />
        }
      >
        <View style={styles.container}>
          {/* AI Insights Section */}
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionTitle}>Athlead</Text>
            <View style={styles.insightsContent}>
              <Ionicons name="analytics" size={24} color="#4F8EF7" style={styles.insightsIcon} />
              <Text style={styles.insightsText}>
                {isHealthKitAuthorized && healthData.steps ? 
                  `Based on your activity data, you've taken ${healthData.steps} steps today. ${
                    healthData.steps < 5000 ? 'Try to reach at least 10,000 steps for better health.' :
                    healthData.steps >= 10000 ? 'Great job! You\'ve reached the recommended daily goal.' :
                    'You\'re on your way to reaching the recommended 10,000 steps.'
                  }` : 
                  'Connect your Apple Watch to get personalized insights based on your health data.'
                }
              </Text>
            </View>
          </View>

          {/* EMG Sensor Section */}
          <View style={styles.metricsContainer}>
            <Text style={styles.sectionTitle}>EMG Muscle Activity</Text>
            
            <TouchableOpacity 
              style={[styles.connectButton, { marginBottom: 16 }]}
              onPress={handleConnectPress}
            >
              <View style={styles.buttonContent}>
                <Ionicons 
                  name={isConnected ? "bluetooth" : "bluetooth-outline"} 
                  size={18} 
                  color="#fff" 
                  style={styles.buttonIcon} 
                />
                <Text style={styles.connectButtonText}>
                  {isConnected ? 'Disconnect EMG Sensor' : 'Connect EMG Sensor'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Device selection modal */}
            {renderDeviceSelectionModal()}

            {/* EMG Data Visualization */}
            {renderEMGVisualization()}
          </View>

          {/* Apple Watch Health Data Section */}
          <View style={styles.metricsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Apple Watch Health Data</Text>
              {isHealthKitAuthorized && (
                <TouchableOpacity 
                  style={styles.refreshIconButton}
                  onPress={forceRefresh}
                >
                  <Ionicons name="refresh-outline" size={20} color="#4F8EF7" />
                </TouchableOpacity>
              )}
            </View>

            {!isHealthKitAuthorized ? (
              <View style={styles.healthDataPlaceholder}>
                <Ionicons name="watch-outline" size={40} color="#ccc" />
                <Text style={styles.placeholderText}>
                  Connect your Apple Watch to view your health metrics
                </Text>
                <TouchableOpacity 
                  style={[styles.connectButton, { marginTop: 16 }]}
                  onPress={handleAppleWatchConnect}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="watch-outline" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.connectButtonText}>Connect Health</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : isHealthKitLoading ? (
              <View style={styles.healthDataPlaceholder}>
                <ActivityIndicator size="large" color="#4F8EF7" />
                <Text style={styles.placeholderText}>Loading health data...</Text>
              </View>
            ) : (
              <>
                <View style={styles.watchInfoRow}>
                  <Ionicons name="watch" size={20} color="#4F8EF7" />
                  <Text style={styles.watchInfoText}>
                    {deviceName || 'Apple Watch'} • Last updated: {healthData.lastUpdated ? 
                      healthData.lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                      'Unknown'}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={forceRefresh}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="refresh-outline" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.refreshButtonText}>Refresh Health Data</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Ionicons name="heart" size={24} color="#FF6B6B" />
                    <Text style={styles.metricValue}>{healthData.heartRate ?? '--'}</Text>
                    <Text style={styles.metricLabel}>BPM</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <Ionicons name="footsteps" size={24} color="#4F8EF7" />
                    <Text style={styles.metricValue}>{healthData.steps ? healthData.steps.toLocaleString() : '--'}</Text>
                    <Text style={styles.metricLabel}>Steps</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <Ionicons name="flame" size={24} color="#FF9500" />
                    <Text style={styles.metricValue}>{healthData.activeEnergyBurned ? Math.round(healthData.activeEnergyBurned) : '--'}</Text>
                    <Text style={styles.metricLabel}>Calories</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <Ionicons name="time" size={24} color="#34C759" />
                    <Text style={styles.metricValue}>{healthData.activeMinutes ? Math.round(healthData.activeMinutes) : '--'}</Text>
                    <Text style={styles.metricLabel}>Exercise (min)</Text>
                  </View>
                </View>
                
                {!healthData.heartRate && !healthData.steps && !healthData.activeEnergyBurned && !healthData.activeMinutes && (
                  <View style={styles.noDataContainer}>
                    <Ionicons name="information-circle-outline" size={24} color="#999" />
                    <Text style={styles.noDataText}>No health data available for today</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.viewDetailsButton}
                  onPress={() => navigation.navigate('HealthData')}
                >
                  <Text style={styles.viewDetailsText}>View Detailed Health Data</Text>
                  <Ionicons name="arrow-forward" size={18} color="#4F8EF7" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );

  // Simple visualization of EMG data
  function renderEMGVisualization() {
    if (emgDataPoints.length === 0) {
      return (
        <View style={styles.emgDataPlaceholder}>
          <Text style={styles.placeholderText}>
            {isConnected 
              ? "Waiting for EMG data..." 
              : "Connect to your EMG sensor to view muscle activity data"}
          </Text>
        </View>
      );
    }

    const maxValue = Math.max(...emgDataPoints, 100);
    
    return (
      <View style={styles.emgVisualizationContainer}>
        <View style={styles.emgGraph}>
          {emgDataPoints.map((value, index) => (
            <View 
              key={index} 
              style={[
                styles.emgBar,
                { 
                  height: `${(value / maxValue) * 100}%`,
                  backgroundColor: value > maxValue * 0.7 ? '#ff4d4d' : '#4F8EF7'
                }
              ]}
            />
          ))}
        </View>
        <View style={styles.emgAxisLabels}>
          <Text style={styles.emgAxisLabel}>Max: {maxValue}</Text>
          <Text style={styles.emgAxisLabel}>Min: 0</Text>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  insightsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
  },
  insightsContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 12,
  },
  insightsIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  insightsText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  deviceContainer: {
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
  deviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  connectButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricsContainer: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  refreshIconButton: {
    padding: 8,
  },
  watchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  watchInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f5ff',
    borderRadius: 8,
  },
  viewDetailsText: {
    color: '#4F8EF7',
    fontWeight: '600',
    marginRight: 5,
  },
  debugContainer: {
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
  debugButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  healthDataPlaceholder: {
    height: 150,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
    padding: 16,
  },
  healthDataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthDataHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthDataHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  healthDataItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  healthDataTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  healthDataValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    width: '100%',
    marginTop: 8,
  },
  healthDataHeaderLeft: {
    flex: 1,
  },
  watchName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  watchSelectorButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
  },
  emgDataPlaceholder: {
    height: 200,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emgVisualizationContainer: {
    height: 200,
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 8,
  },
  emgGraph: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
  },
  emgBar: {
    width: 4,
    marginHorizontal: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  emgAxisLabels: {
    width: 50,
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  emgAxisLabel: {
    fontSize: 12,
    color: '#666',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 6,
  },
  placeholderText: {
    color: '#999',
    textAlign: 'center',
    padding: 16,
  },
  refreshButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noDataContainer: {
    height: 150,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
    padding: 16,
  },
  noDataText: {
    color: '#999',
    textAlign: 'center',
    padding: 16,
  },
  deviceListContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  deviceListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f0f7ff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  deviceList: {
    maxHeight: 200,
  },
  deviceItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  targetDeviceItem: {
    backgroundColor: '#f0f7ff',
  },
  deviceItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceInfo: {
    marginLeft: 8,
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginBottom: 16,
  },
  scanningText: {
    marginLeft: 8,
    color: '#4F8EF7',
    fontWeight: '500',
  },
  noDevicesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noDevicesText: {
    marginTop: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default HomeScreen; 