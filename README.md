# Athlead

A React Native mobile application for tracking muscle activity using EMG sensors and providing real-time feedback for athletic performance.

## Features

- Real-time EMG sensor data visualization
- Bluetooth Low Energy (BLE) connectivity
- Workout history tracking
- User profile management
- Health data integration

## Prerequisites

- Node.js >= 14
- Xcode (for iOS development)
- CocoaPods
- Android Studio (for Android development)

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd Athlead
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies:
```bash
cd ios
pod install
cd ..
```

## Running the App

### iOS
```bash
npx expo run:ios
```

### Android
```bash
npx expo run:android
```

## Development

The app is built using:
- React Native
- Expo
- React Navigation
- react-native-ble-plx for BLE communication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 