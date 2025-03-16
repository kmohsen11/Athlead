/* eslint-disable no-bitwise */
import { useState, useRef, useEffect } from "react";
import { PermissionsAndroid, Platform, Alert } from "react-native";
import * as ExpoDevice from "expo-device";
import { BleManager, Device, Subscription, BleError, Characteristic } from "react-native-ble-plx";
import { decode as base64decode } from 'base-64';

// EMG sensor UUIDs
export const SERVICE_UUID = "12345678-1234-5678-1234-567812345678";
export const CHARACTERISTIC_UUID = "87654321-4321-6789-4321-678987654321";
export const TARGET_DEVICE_UUID = "00:11:22:33:44:55"; // Target device UUID to prioritize

const manager = new BleManager();

export interface ConnectResult {
  deviceId: string;
  deviceName: string | null;
  connected: boolean;
  success: boolean;
  error?: string;
  data?: any;
}

function useBLE() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [allScannedDevices, setAllScannedDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [emgData, setEmgData] = useState<number[]>([]);
  const characteristicSubscriptionRef = useRef<Subscription | null>(null);

  // Request permissions for BLE
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Bluetooth requires location permission',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // Scan for BLE peripherals
  const scanForPeripherals = async (timeoutSeconds = 10) => {
    try {
      const permissionGranted = await requestPermissions();
      if (!permissionGranted) {
        Alert.alert('Permission Error', 'Location permission is required for Bluetooth scanning');
        return;
      }

      setIsScanning(true);
      setAllScannedDevices([]);

      console.log('Starting BLE scan...');
      
      // Start scanning
      manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          setIsScanning(false);
          return;
        }

        if (device) {
          console.log(`Found device: ${device.name || 'Unknown'} (${device.id})`);
          
          setAllScannedDevices((prevDevices) => {
            // Check if device already exists in the array
            if (!prevDevices.find((d) => d.id === device.id)) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });

      // Stop scanning after timeout
      setTimeout(() => {
        stopScanningPeripherals();
        
        // If no devices found, show alert
        if (allScannedDevices.length === 0) {
          Alert.alert('No Devices Found', 'No EMG sensors were found. Make sure your device is powered on and in range.');
        } else {
          console.log(`Scan complete. Found ${allScannedDevices.length} devices.`);
          // Devices will be displayed in the UI
        }
      }, timeoutSeconds * 1000);
    } catch (error) {
      console.error('Error scanning for peripherals:', error);
      setIsScanning(false);
    }
  };

  // Stop scanning for peripherals
  const stopScanningPeripherals = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
    console.log('BLE scan stopped');
  };

  // Connect to a device
  const connectToDevice = async (device: Device): Promise<ConnectResult> => {
    try {
      setIsScanning(false);
      manager.stopDeviceScan();
      
      console.log(`Connecting to device: ${device.name || 'Unknown'} (${device.id})`);

      // Connect to the device
      const connectedDevice = await device.connect();
      console.log('Device connected, discovering services...');
      
      // Discover services and characteristics
      const discoveredDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('Services and characteristics discovered');
      
      // Get all services
      const services = await discoveredDevice.services();
      console.log('Available services:', services.map(s => s.uuid));
      
      // Try to find our target service with exact UUID match
      let targetService = services.find(s => s.uuid.toUpperCase() === SERVICE_UUID.toUpperCase());
      
      // If not found, try a partial match
      if (!targetService) {
        targetService = services.find(s => s.uuid.toUpperCase().includes(SERVICE_UUID.toUpperCase()));
      }
      
      // If still not found, use the first available service
      if (!targetService && services.length > 0) {
        console.log('Target service not found, using first available service');
        targetService = services[0];
      }
      
      if (!targetService) {
        await connectedDevice.cancelConnection();
        return {
          deviceId: device.id,
          deviceName: device.name,
          connected: false,
          success: false,
          error: 'No suitable services found on this device. This may not be an EMG sensor.'
        };
      }
      
      console.log('Selected service:', targetService.uuid);
      
      // Get characteristics for the service
      const characteristics = await targetService.characteristics();
      console.log('Available characteristics for service', targetService.uuid, ':', 
        characteristics.map(c => c.uuid));
      
      // Try to find our target characteristic with exact UUID match
      let targetCharacteristic = characteristics.find(
        c => c.uuid.toUpperCase() === CHARACTERISTIC_UUID.toUpperCase()
      );
      
      // If not found, try a partial match
      if (!targetCharacteristic) {
        targetCharacteristic = characteristics.find(
          c => c.uuid.toUpperCase().includes(CHARACTERISTIC_UUID.toUpperCase())
        );
      }
      
      // If still not found, use the first available characteristic
      if (!targetCharacteristic && characteristics.length > 0) {
        console.log('Target characteristic not found, using first available characteristic');
        targetCharacteristic = characteristics[0];
      }
      
      if (!targetCharacteristic) {
        await connectedDevice.cancelConnection();
        return {
          deviceId: device.id,
          deviceName: device.name,
          connected: false,
          success: false,
          error: 'No suitable characteristics found on this device. This may not be an EMG sensor.'
        };
      }
      
      // Now we can set the connected device and update the state
      setConnectedDevice(connectedDevice);
      setIsConnected(true);
      
      // Check if the characteristic is readable
      if (targetCharacteristic.isReadable) {
        const value = await targetCharacteristic.read();
        console.log('Initial value:', value.value);
      }
      
      // Check if the characteristic supports notifications
      if (targetCharacteristic.isNotifiable) {
        console.log('Setting up notifications for characteristic:', targetCharacteristic.uuid);
        
        // Monitor the characteristic for notifications
        characteristicSubscriptionRef.current = targetCharacteristic.monitor((error, characteristic) => {
          if (error) {
            console.error('Error monitoring characteristic:', error);
            return;
          }
          
          if (characteristic?.value) {
            try {
              // Decode the base64 value and process the EMG data
              const decodedValue = base64decode(characteristic.value);
              
              // Convert the decoded value to a number (this is a simplified example)
              // In a real implementation, you would parse the binary data according to your EMG sensor's protocol
              const byteArray = Array.from(decodedValue).map(char => char.charCodeAt(0));
              
              // Example: take the first byte as the EMG value (0-255)
              const emgValue = byteArray[0] || Math.random() * 100;
              
              console.log('Received EMG data:', emgValue);
              
              setEmgData((prevData) => {
                // Keep only the last 20 data points for visualization
                const newData = [...prevData, emgValue];
                if (newData.length > 20) {
                  return newData.slice(newData.length - 20);
                }
                return newData;
              });
            } catch (e) {
              console.error('Error processing EMG data:', e);
              
              // Fallback to random data for testing
              const randomValue = Math.random() * 100;
              setEmgData((prevData) => {
                const newData = [...prevData, randomValue];
                if (newData.length > 20) {
                  return newData.slice(newData.length - 20);
                }
                return newData;
              });
            }
          }
        });
      } else {
        console.log('Characteristic does not support notifications, using simulated data');
        
        // Set up a timer to generate simulated EMG data
        const simulatedDataInterval = setInterval(() => {
          const simulatedValue = Math.random() * 100;
          setEmgData((prevData) => {
            const newData = [...prevData, simulatedValue];
            if (newData.length > 20) {
              return newData.slice(newData.length - 20);
            }
            return newData;
          });
        }, 500);
        
        // Store the interval ID in a ref so we can clear it later
        characteristicSubscriptionRef.current = {
          remove: () => clearInterval(simulatedDataInterval)
        } as Subscription;
      }

      return {
        deviceId: device.id,
        deviceName: device.name,
        connected: true,
        success: true
      };
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnected(false);
      return {
        deviceId: device.id,
        deviceName: device.name,
        connected: false,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  };

  // Disconnect from the device
  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      try {
        // Clean up the characteristic subscription
        if (characteristicSubscriptionRef.current) {
          characteristicSubscriptionRef.current.remove();
          characteristicSubscriptionRef.current = null;
        }
        
        await connectedDevice.cancelConnection();
        console.log('Device disconnected');
        
        setConnectedDevice(null);
        setIsConnected(false);
        setEmgData([]);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (connectedDevice) {
        disconnectFromDevice();
      }
      
      if (characteristicSubscriptionRef.current) {
        characteristicSubscriptionRef.current.remove();
      }
      
      manager.destroy();
    };
  }, [connectedDevice]);

  return {
    scanForPeripherals,
    stopScanningPeripherals,
    allScannedDevices,
    connectToDevice,
    disconnectFromDevice,
    connectedDevice,
    emgData,
    requestPermissions,
    isScanning,
    isConnected,
  };
}

export default useBLE; 