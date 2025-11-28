import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomModal } from '../src/components/CustomModal';
import { SHADOWS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';

import { getAuthHeaders } from '../src/utils/auth';

export default function Settings() {
    const { colors, theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' }>({
        title: '',
        message: '',
        type: 'info',
    });

    const handlePasswordReset = () => {
        router.push('/change-password');
    };

    const handleDeleteAccount = () => {
        setDeleteModalVisible(true);
    };

    const confirmDeleteAccount = async () => {
        setDeleteModalVisible(false);
        try {
            const headers = await getAuthHeaders();
            await axios.delete('/users/profile', headers);

            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
            router.replace('/');
        } catch (error) {
            console.error('Error deleting account:', error);
            setModalConfig({
                title: 'Error',
                message: 'Failed to delete account. Please try again.',
                type: 'error',
            });
            setModalVisible(true);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Appearance Section */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                                <Ionicons name="moon" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#767577', true: colors.primary }}
                            thumbColor={'#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Security Section */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security</Text>
                    <TouchableOpacity style={styles.row} onPress={handlePasswordReset}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                                <Ionicons name="lock-closed" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Change Password</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View style={[styles.section, { backgroundColor: colors.surface, marginTop: SPACING.xl }]}>
                    <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
                                <Ionicons name="trash" size={20} color={colors.error} />
                            </View>
                            <Text style={[styles.rowLabel, { color: colors.error }]}>Delete Account</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <CustomModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={() => setModalVisible(false)}
            />

            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="warning" size={40} color={colors.error} />
                        </View>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Delete Account</Text>
                        <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                            Are you sure you want to delete your account? This action cannot be undone.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteButton, { backgroundColor: colors.error }]}
                                onPress={confirmDeleteAccount}
                            >
                                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    section: {
        borderRadius: 16,
        padding: SPACING.m,
        marginBottom: SPACING.l,
        ...SHADOWS.small,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.m,
        marginLeft: SPACING.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.s,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: '500',
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
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: SPACING.m,
    },
    modalButton: {
        flex: 1,
        paddingVertical: SPACING.m,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    deleteButton: {
        // backgroundColor set inline
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
