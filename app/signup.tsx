import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { SHADOWS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';

export default function Signup() {
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'error'>('error');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const router = useRouter();

    const showModal = (type: 'success' | 'error', title: string, message: string) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        if (modalType === 'success') {
            router.replace('/');
        }
    };

    const handleSignup = async () => {
        if (!email || !username || !password || !confirmPassword) {
            showModal('error', 'Error', 'Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showModal('error', 'Error', 'Please enter a valid email address');
            return;
        }

        if (password !== confirmPassword) {
            showModal('error', 'Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/auth/signup', { username, email, password, confirmPassword });
            showModal('success', 'Success', 'Account created successfully! Please login.');
        } catch (error: any) {
            console.error('Signup Error:', error);
            if (error.response) {
                console.error('Response Data:', error.response.data);
                console.error('Response Status:', error.response.status);
            } else if (error.request) {
                console.error('No response received:', error.request);
                showModal('error', 'Network Error', 'Could not connect to the server. Please check your internet connection or server URL.');
                return;
            } else {
                console.error('Error Message:', error.message);
            }

            const message = error.response?.data?.message || 'Signup failed';
            const errors = error.response?.data?.errors;
            if (errors) {
                showModal('error', 'Error', errors.map((e: any) => e.message).join('\n'));
            } else {
                showModal('error', 'Error', message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
                <Animated.View entering={FadeInUp.delay(200).duration(1000).springify()}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign up to get started</Text>
                </Animated.View>

                <Animated.View style={styles.form} entering={FadeInDown.delay(400).duration(1000).springify()}>
                    <Input
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Username"
                        placeholder="Choose a username"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    <Input
                        label="Password"
                        placeholder="Create a password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Input
                        label="Confirm Password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <View style={styles.buttonContainer}>
                        <Button title="Sign Up" onPress={handleSignup} loading={loading} />
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
                        <Link href="/" asChild>
                            <Button title="Login" variant="ghost" style={{ width: 'auto', paddingHorizontal: 0, paddingVertical: 0 }} />
                        </Link>
                    </View>
                </Animated.View>
            </View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleModalClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <FontAwesome
                                name={modalType === 'success' ? 'check-circle' : 'exclamation-circle'}
                                size={50}
                                color={modalType === 'success' ? colors.primary : colors.error}
                            />
                        </View>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{modalTitle}</Text>
                        <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{modalMessage}</Text>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: modalType === 'success' ? colors.primary : colors.error }]}
                            onPress={handleModalClose}
                        >
                            <Text style={styles.modalButtonText}>
                                {modalType === 'success' ? 'Login Now' : 'Try Again'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: SPACING.l,
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
        marginBottom: SPACING.l,
    },
    footerText: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        borderRadius: 20,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        ...SHADOWS.large,
    },
    modalHeader: {
        marginBottom: SPACING.m,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 22,
    },
    modalButton: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.xl,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
