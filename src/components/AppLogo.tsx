import React from 'react';
import { Image, StyleSheet, View, ImageProps } from 'react-native';

interface AppLogoProps {
  size?: number;
  style?: ImageProps['style'];
}

/**
 * A component that displays the app logo
 */
const AppLogo: React.FC<AppLogoProps> = ({ size = 100, style }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={[
          styles.logo,
          { width: size, height: size },
          style
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
});

export default AppLogo; 