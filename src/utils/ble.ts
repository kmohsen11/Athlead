/* eslint-disable no-bitwise */
import { useState, useRef } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";
import { BleManager, Device, Subscription, BleError, Characteristic } from "react-native-ble-plx";

// Correct UUIDs for the EMG sensor
export const SERVICE_UUID = "12345678-1234-5678-1234-567812345678";
export const CHARACTERISTIC_UUID = "87654321-4321-6789-4321-678987654321";

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
  const [allScannedDevices, setAllScannedDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [emgData, setEmgData] = useState<number[]>([]);
  const characteristicSubscriptionRef = useRef<Subscription | null>(null);

  // Request permissions for BLE on Android
  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Bluetooth Scan Permission",
        message: "App needs Bluetooth Scan permission for EMG sensor",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Bluetooth Connect Permission",
        message: "App needs Bluetooth Connect permission for EMG sensor",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location permission",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        return await requestAndroid31Permissions();
      }
    } else {
      return true;
    }
  };

  // Scan for BLE devices
  const scanForPeripherals = async (timeoutSeconds: number = 10) => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      console.log("No permissions granted for BLE");
      return;
    }

    setAllScannedDevices([]);
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error: BleError | null, device: Device | null) => {
      if (error) {
        console.error("Scanning error:", error);
        stopScanningPeripherals();
        return;
      }

      if (device && !isDuplicateDevice(allScannedDevices, device)) {
        setAllScannedDevices((prevDevices) => [...prevDevices, device]);
      }
    });

    // Stop scanning after timeout
    if (timeoutSeconds > 0) {
      setTimeout(() => {
        stopScanningPeripherals();
      }, timeoutSeconds * 1000);
    }
  };

  const stopScanningPeripherals = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  // Check if device is already in the list
  const isDuplicateDevice = (devices: Device[], nextDevice: Device) => {
    return devices.some((device) => device.id === nextDevice.id);
  };

  // Connect to EMG sensor
  const connectToDevice = async (device: Device): Promise<ConnectResult> => {
    try {
      // First disconnect if already connected
      if (connectedDevice) {
        await disconnectFromDevice();
      }

      console.log(`Connecting to device: ${device.id}`);
      const deviceConnection = await manager.connectToDevice(device.id);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      
      // Subscribe to EMG data notifications
      await subscribeToEMGData(deviceConnection);
      
      setConnectedDevice(deviceConnection);
      
      return {
        deviceId: device.id,
        deviceName: device.name,
        connected: true,
        success: true
      };
    } catch (error) {
      console.error("Connection error:", error);
      return {
        deviceId: device.id,
        deviceName: device.name,
        connected: false,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  };

  // Subscribe to EMG data notifications
  const subscribeToEMGData = async (device: Device) => {
    try {
      // Unsubscribe from previous subscription if exists
      if (characteristicSubscriptionRef.current) {
        characteristicSubscriptionRef.current.remove();
      }

      // Subscribe to notifications
      const subscription = device.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (error: BleError | null, characteristic: Characteristic | null) => {
          if (error) {
            console.error("Error monitoring EMG data:", error);
            return;
          }

          if (characteristic?.value) {
            const decodedValue = base64.decode(characteristic.value);
            try {
              // Parse EMG data - adjust this based on your sensor's data format
              const dataArray = Array.from(new Uint8Array(
                decodedValue.split('').map((c: string) => c.charCodeAt(0))
              ));
              
              setEmgData((prevData) => {
                // Keep last 100 data points for visualization
                const newData = [...prevData, ...dataArray];
                return newData.slice(Math.max(0, newData.length - 100));
              });
            } catch (e) {
              console.error("Error parsing EMG data:", e);
            }
          }
        }
      );

      characteristicSubscriptionRef.current = subscription;
      console.log("Successfully subscribed to EMG data");
    } catch (error) {
      console.error("Failed to subscribe to EMG data:", error);
    }
  };

  // Disconnect from device
  const disconnectFromDevice = async () => {
    if (characteristicSubscriptionRef.current) {
      characteristicSubscriptionRef.current.remove();
      characteristicSubscriptionRef.current = null;
    }

    if (connectedDevice) {
      try {
        await manager.cancelDeviceConnection(connectedDevice.id);
        console.log(`Disconnected from device: ${connectedDevice.id}`);
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
      setConnectedDevice(null);
    }
  };

  return {
    scanForPeripherals,
    stopScanningPeripherals,
    allScannedDevices,
    connectToDevice,
    disconnectFromDevice,
    connectedDevice,
    isScanning,
    emgData,
    requestPermissions
  };
}

export default useBLE; 