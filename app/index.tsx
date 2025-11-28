import axios from 'axios';
import { Link, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../src/components/Button';
import { CustomModal } from '../src/components/CustomModal';
import { Input } from '../src/components/Input';
import { SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';

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

  useEffect(() => {
    checkLogin();
  }, []);

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
});
