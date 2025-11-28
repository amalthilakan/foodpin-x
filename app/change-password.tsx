import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { CustomModal } from '../src/components/CustomModal';
import { Input } from '../src/components/Input';
import { SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { getAuthHeaders } from '../src/utils/auth';

export default function ChangePassword() {
    const { colors } = useTheme();
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' }>({
        title: '',
        message: '',
        type: 'info',
    });

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setModalConfig({
                title: 'Error',
                message: 'Please fill in all fields',
                type: 'error',
            });
            setModalVisible(true);
            return;
        }

        if (newPassword !== confirmPassword) {
            setModalConfig({
                title: 'Error',
                message: 'New passwords do not match',
                type: 'error',
            });
            setModalVisible(true);
            return;
        }

        if (newPassword.length < 6) {
            setModalConfig({
                title: 'Error',
                message: 'Password must be at least 6 characters long',
                type: 'error',
            });
            setModalVisible(true);
            return;
        }

        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            await axios.put('/auth/change-password', {
                currentPassword,
                newPassword
            }, headers);

            setModalConfig({
                title: 'Success',
                message: 'Your password has been updated successfully.',
                type: 'success',
            });
            setModalVisible(true);
        } catch (error: any) {
            console.error('Change Password Error:', error);
            const message = error.response?.data?.message || 'Failed to update password. Please check your current password.';
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

    const handleModalClose = () => {
        setModalVisible(false);
        if (modalConfig.type === 'success') {
            router.back();
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Change Password</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInDown.duration(600).springify()}>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Your new password must be different from previous used passwords.
                    </Text>

                    <Input
                        label="Current Password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry
                        hideToggle
                    />

                    <Input
                        label="New Password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        hideToggle
                    />

                    <Input
                        label="Confirm New Password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        hideToggle
                    />

                    <View style={styles.buttonContainer}>
                        <Button
                            title="Update Password"
                            onPress={handleChangePassword}
                            loading={loading}
                        />
                    </View>
                </Animated.View>
            </ScrollView>

            <CustomModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={handleModalClose}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
    },
    backButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: SPACING.l,
    },
    description: {
        fontSize: 14,
        marginBottom: SPACING.xl,
        lineHeight: 20,
    },
    buttonContainer: {
        marginTop: SPACING.l,
    },
});
