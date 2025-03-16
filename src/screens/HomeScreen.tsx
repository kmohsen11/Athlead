import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, AlertButton } from 'react-native';
import useBLE from '../utils/ble';
import { Ionicons } from '@expo/vector-icons';
import { Device } from 'react-native-ble-plx';

const HomeScreen = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [emgDataPoints, setEmgDataPoints] = useState<number[]>([]);
  
  const { 
    scanForPeripherals, 
    stopScanningPeripherals, 
    allScannedDevices, 
    connectToDevice, 
    disconnectFromDevice, 
    connectedDevice,
    emgData,
    requestPermissions
  } = useBLE();

  // Update connection status when device connection changes
  useEffect(() => {
    setIsConnected(connectedDevice !== null);
  }, [connectedDevice]);

  // Update EMG data when it changes
  useEffect(() => {
    if (emgData.length > 0) {
      setEmgDataPoints(emgData);
    }
  }, [emgData]);

  const handleConnectPress = async () => {
    if (isConnected) {
      // Disconnect from device
      await disconnectFromDevice();
      setIsConnected(false);
    } else {
      // Request permissions first
      const permissionsGranted = await requestPermissions();
      if (!permissionsGranted) {
        Alert.alert(
          "Permission Required", 
          "Bluetooth permissions are required to connect to the EMG sensor."
        );
        return;
      }

      // Start scanning for devices
      setIsScanning(true);
      scanForPeripherals(5); // Scan for 5 seconds
      
      // Show device selection after scanning completes
      setTimeout(() => {
        setIsScanning(false);
        stopScanningPeripherals();
        
        if (allScannedDevices.length === 0) {
          Alert.alert(
            "No Devices Found", 
            "No EMG sensors were found. Make sure your device is powered on and in range."
          );
        } else {
          // If only one device found, connect to it automatically
          if (allScannedDevices.length === 1) {
            handleDeviceConnection(allScannedDevices[0]);
          } else {
            // Show device selection dialog
            showDeviceSelectionDialog();
          }
        }
      }, 5000);
    }
  };

  const showDeviceSelectionDialog = () => {
    // Create buttons for each device
    const buttons: AlertButton[] = allScannedDevices.map(device => ({
      text: device.name || `Unknown Device (${device.id})`,
      onPress: () => handleDeviceConnection(device)
    }));
    
    // Add cancel button
    buttons.push({
      text: "Cancel",
      style: "cancel"
    });
    
    Alert.alert(
      "Select EMG Sensor",
      "Choose a device to connect:",
      buttons
    );
  };

  const handleDeviceConnection = async (device: Device) => {
    try {
      const result = await connectToDevice(device);
      if (result.success) {
        setIsConnected(true);
        Alert.alert("Connected", `Successfully connected to ${result.deviceName || 'EMG sensor'}`);
      } else {
        Alert.alert("Connection Failed", result.error || "Failed to connect to the device");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred while connecting");
      console.error(error);
    }
  };

  // Simple visualization of EMG data
  const renderEMGVisualization = () => {
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
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* AI Insights Box */}
        <View style={styles.aiInsightsBox}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <Text style={styles.aiInsightsText}>
            {isConnected 
              ? "Analyzing your muscle activity data in real-time..." 
              : "Connect to your EMG sensor to receive real-time AI feedback on your muscle activity."}
          </Text>
        </View>

        {/* Connect Button */}
        <TouchableOpacity 
          style={[
            styles.connectButton, 
            isConnected ? styles.connectedButton : {}
          ]}
          onPress={handleConnectPress}
          disabled={isScanning}
        >
          {isScanning ? (
            <View style={styles.scanningContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.connectButtonText}>Scanning for devices...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons 
                name={isConnected ? "bluetooth" : "bluetooth-outline"} 
                size={20} 
                color="#fff" 
                style={styles.buttonIcon} 
              />
              <Text style={styles.connectButtonText}>
                {isConnected ? "Disconnect Sensor" : "Connect to EMG Sensor"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* EMG Data Visualization */}
        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>EMG Data</Text>
          {renderEMGVisualization()}
        </View>

        {/* Apple Watch Health Data Placeholder */}
        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Health Data</Text>
          <View style={styles.healthDataContainer}>
            <View style={styles.healthDataItem}>
              <Text style={styles.healthDataTitle}>Heart Rate</Text>
              <Text style={styles.healthDataValue}>-- BPM</Text>
            </View>
            <View style={styles.healthDataItem}>
              <Text style={styles.healthDataTitle}>Steps</Text>
              <Text style={styles.healthDataValue}>--</Text>
            </View>
            <View style={styles.healthDataItem}>
              <Text style={styles.healthDataTitle}>Calories</Text>
              <Text style={styles.healthDataValue}>-- kcal</Text>
            </View>
            <View style={styles.healthDataItem}>
              <Text style={styles.healthDataTitle}>Active Minutes</Text>
              <Text style={styles.healthDataValue}>-- min</Text>
            </View>
          </View>
        </View>
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
  aiInsightsBox: {
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
    marginBottom: 8,
    color: '#333',
  },
  aiInsightsText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  connectButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  connectedButton: {
    backgroundColor: '#f44336',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataSection: {
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
  placeholderText: {
    color: '#999',
    textAlign: 'center',
    padding: 16,
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
  healthDataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
});

export default HomeScreen; 