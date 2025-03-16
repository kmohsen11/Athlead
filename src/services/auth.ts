import { Platform } from 'react-native';

// Configure the redirect URL to use your app's URL scheme
const redirectUri = Platform.OS === 'web' 
  ? 'YOUR_WEB_REDIRECT_URL' 
  : 'athlead://'; // This matches the URL scheme defined in app.json

export const signIn = async () => {
  // Use the redirectUri in your authentication flow
  // Example for OAuth:
  // authClient.authorize({ redirectUri });
  
  // ...existing code...
};

// ...existing code...