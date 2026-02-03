import { FontAwesome } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { Link, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { User as FirebaseUser, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../src/components/Button';
import { CustomModal } from '../src/components/CustomModal';
import { Input } from '../src/components/Input';
import { SHADOWS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { auth } from '../src/firebaseConfig';

export default function Login() {
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' }>({
    title: '',
    message: '',
    type: 'info',
  });
  const router = useRouter();

  // Configure Google Sign-In on mount
  useEffect(() => {
    configureGoogleSignIn();
    checkLogin();
  }, []);

  const configureGoogleSignIn = () => {
    try {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

      if (!webClientId) {
        console.error('❌ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set in environment variables');
        throw new Error('Google Web Client ID is not configured');
      }

      GoogleSignin.configure({
        webClientId,
        offlineAccess: true,
      });

      console.log('✅ Google Sign-In configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure Google Sign-In:', error);
    }
  };

  const checkLogin = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      router.replace('/(tabs)/home');
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setModalConfig({
        title: 'Error',
        message: 'Please fill in all fields',
        type: 'error',
      });
      setModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/auth/login', { username, password });
      const { token, user } = response.data;

      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));

      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Login failed';
      setModalConfig({
        title: 'Error',
        message: message,
        type: 'error',
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseLogin = async (firebaseUser: FirebaseUser) => {
    setLoading(true);
    try {
      console.log('🔄 Handling Firebase login for:', firebaseUser.email);

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      console.log('✅ Got Firebase ID token');

      // Send Firebase ID token to backend for verification
      console.log('🔄 Sending token to backend...');
      const response = await axios.post('/auth/firebase', {
        idToken: idToken
      });

      console.log('✅ Backend authentication successful');
      const { token, user } = response.data;

      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      console.log('✅ User data saved to secure storage');

      console.log('✅ Login complete! Redirecting to home...');
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('❌ Firebase login error:', error);
      console.error('Error details:', error.response?.data);

      const message = error.response?.data?.message || error.response?.data?.hint || 'Google Login failed';
      setModalConfig({
        title: 'Error',
        message: message,
        type: 'error',
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting Google Sign-In process...');

      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('✅ Google Play Services available');

      // Sign in with Google
      const signInResponse = await GoogleSignin.signIn();

      if (signInResponse.type !== 'success') {
        console.log('User cancelled sign-in');
        setLoading(false);
        return;
      }

      const userInfo = signInResponse.data;
      console.log('Google Sign-In successful, user:', userInfo.user?.email);

      // Get Google ID token from the response
      const idToken = userInfo.idToken;

      if (!idToken) {
        console.error('❌ No ID token received from Google Sign-In');
        throw new Error('No ID token received from Google Sign-In');
      }

      console.log('✅ Got ID token from Google');

      // Get Google credential
      const googleCredential = GoogleAuthProvider.credential(idToken);
      console.log('✅ Created Google credential');

      // Sign in to Firebase with the Google credential
      const userCredential = await signInWithCredential(auth, googleCredential);
      console.log('✅ Firebase authentication successful for:', userCredential.user.email);

      // Handle Firebase login
      await handleFirebaseLogin(userCredential.user);
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);

      // Don't show error if user cancelled
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === '-5') {
        console.log('ℹ️ User cancelled sign-in');
        setLoading(false);
        return;
      }

      let errorMessage = 'Failed to sign in with Google';

      // Provide more specific error messages
      if (error.code === 'DEVELOPER_ERROR') {
        errorMessage = 'Configuration error. Please contact support.';
        console.error('⚠️ DEVELOPER_ERROR: Check SHA-1 fingerprint in Firebase Console');
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setModalConfig({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
      setModalVisible(true);
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInUp.delay(200).duration(1000).springify()}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Login to your account</Text>
      </Animated.View>

      <Animated.View style={styles.form} entering={FadeInDown.delay(400).duration(1000).springify()}>
        <Input
          label="Username"
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.buttonContainer}>
          <Button title="Login" onPress={handleLogin} loading={loading} />

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <FontAwesome name="google" size={20} color={colors.textPrimary} />
            <Text style={[styles.googleButtonText, { color: colors.textPrimary }]}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <Link href="/signup" asChild>
            <Button title="Sign Up" variant="ghost" style={{ width: 'auto', paddingHorizontal: 0, paddingVertical: 0 }} />
          </Link>
        </View>
      </Animated.View>

      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
      />
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.l,
    backgroundColor: '#F8F9FA', // Default fallback, overridden by dynamic style
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  form: {
    width: '100%',
  },
  buttonContainer: {
    marginTop: SPACING.m,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.l,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: SPACING.m,
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.m,
    borderRadius: 12,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: SPACING.m,
  },
});
