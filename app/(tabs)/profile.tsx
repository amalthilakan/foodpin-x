import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { COLORS, SHADOWS, SPACING } from '../../src/constants/theme';
import { getAuthHeaders } from '../../src/utils/auth';
import { resetWelcomeToast } from './home';

export default function Profile() {
    const [user, setUser] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (successVisible) {
            const timer = setTimeout(() => {
                setSuccessVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successVisible]);

    useEffect(() => {
        const getUser = async () => {
            // Try to load from SecureStore first for speed
            const userData = await SecureStore.getItemAsync('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }

            // Then fetch fresh data from API (including profile picture if not in SecureStore)
            try {
                const headers = await getAuthHeaders();
                const response = await axios.get('/users/profile', headers);
                if (response.data) {
                    setUser(response.data);
                    // Update SecureStore with fresh data, but EXCLUDE profile picture
                    const { profilePicture: _, ...userToSave } = response.data;
                    await SecureStore.setItemAsync('user', JSON.stringify(userToSave));
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        resetWelcomeToast();
        router.replace('/');
    };

    const handlePickImage = () => {
        setModalVisible(true);
    };

    const handleCamera = async () => {
        setModalVisible(false);
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert('Permission to access camera is required!');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled && result.assets[0].base64) {
            handleUpdateProfile(result.assets[0].base64);
        }
    };

    const handleGallery = async () => {
        setModalVisible(false);
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert('Permission to access gallery is required!');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled && result.assets[0].base64) {
            handleUpdateProfile(result.assets[0].base64);
        }
    };

    const handleUpdateProfile = async (base64Image: string) => {
        try {
            const profilePicture = `data:image/jpeg;base64,${base64Image}`;
            const headers = await getAuthHeaders();
            const updatedUser = await axios.put('/users/profile', { profilePicture }, headers);

            // Update local state with full user data (including image)
            setUser(updatedUser.data);

            // Update SecureStore EXCLUDING profile picture to avoid size warning
            const { profilePicture: _, ...userToSave } = updatedUser.data;
            await SecureStore.setItemAsync('user', JSON.stringify(userToSave));

            setSuccessVisible(true);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile picture');
        }
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View
                entering={FadeInUp.duration(600)}
                style={styles.header}
            >
                <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                    {user.profilePicture ? (
                        <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {user.username?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.editIconContainer}>
                        <Text style={styles.editIcon}>+</Text>
                    </View>
                </TouchableOpacity>
                <Text style={styles.title}>{user.username || 'User'}</Text>
                <Text style={styles.subtitle}>{user.email}</Text>
            </Animated.View>

            <Animated.View
                entering={FadeInDown.duration(600).delay(200)}
                style={styles.content}
            >
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Member Since</Text>
                        <Text style={styles.value}>
                            {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{user.email}</Text>
                    </View>
                </View>

                <Button
                    title="Logout"
                    onPress={handleLogout}
                    variant="outline"
                    style={styles.logoutButton}
                />
            </Animated.View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Profile Picture</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <FontAwesome name="times" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalOptions}>
                            <TouchableOpacity style={styles.optionButton} onPress={handleCamera}>
                                <View style={styles.optionIconContainer}>
                                    <FontAwesome name="camera" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.optionText}>Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionButton} onPress={handleGallery}>
                                <View style={styles.optionIconContainer}>
                                    <FontAwesome name="image" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.optionText}>Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={successVisible}
                onRequestClose={() => setSuccessVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.successContent}>
                            <FontAwesome name="check-circle" size={60} color={COLORS.primary} />
                            <Text style={styles.successTitle}>Success!</Text>
                            <Text style={styles.successMessage}>Profile picture updated successfully</Text>
                            <TouchableOpacity
                                style={styles.successButton}
                                onPress={() => setSuccessVisible(false)}
                            >
                                <Text style={styles.successButtonText}>OK</Text>
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
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    header: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.l,
    },
    avatarContainer: {
        marginBottom: SPACING.m,
        position: 'relative',
        ...SHADOWS.medium,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.surface,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.secondary,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    editIcon: {
        color: COLORS.surface,
        fontWeight: 'bold',
        fontSize: 18,
        marginTop: -2,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.l,
    },
    infoCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.l,
        marginBottom: SPACING.xl,
        ...SHADOWS.small,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.s,
    },
    label: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.m,
    },
    logoutButton: {
        borderColor: COLORS.error,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.l,
        width: '100%',
        maxWidth: 340,
        ...SHADOWS.large,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    modalOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: SPACING.s,
    },
    optionButton: {
        alignItems: 'center',
        padding: SPACING.m,
    },
    optionIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    successContent: {
        alignItems: 'center',
        padding: SPACING.m,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: SPACING.m,
        marginBottom: SPACING.s,
    },
    successMessage: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.l,
    },
    successButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.xl,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    successButtonText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
