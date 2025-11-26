import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { SHADOWS, SPACING } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { getAuthHeaders } from '../../src/utils/auth';
import { resetWelcomeToast } from './home';

export default function Profile() {
    const { colors, theme, toggleTheme } = useTheme();
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
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.View
                entering={FadeInUp.duration(600)}
                style={styles.header}
            >
                <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                    {user.profilePicture ? (
                        <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.avatarText, { color: colors.surface }]}>
                                {user.username?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.editIconContainer, { backgroundColor: colors.secondary, borderColor: colors.background }]}>
                        <Text style={[styles.editIcon, { color: colors.surface }]}>+</Text>
                    </View>
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                    {user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'User'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{user.email}</Text>
            </Animated.View>

            <Animated.View
                entering={FadeInDown.duration(600).delay(200)}
                style={styles.content}
            >
                <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.infoRow}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Member Since</Text>
                        <Text style={[styles.value, { color: colors.textPrimary }]}>
                            {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : 'N/A'}
                        </Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.infoRow}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                        <Text style={[styles.value, { color: colors.textPrimary }]}>{user.email}</Text>
                    </View>
                </View>

                <View style={[styles.infoCard, { backgroundColor: colors.surface, marginBottom: SPACING.xl }]}>
                    <View style={styles.infoRow}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Dark Mode</Text>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#767577', true: colors.primary }}
                            thumbColor={'#f4f3f4'}
                        />
                    </View>
                </View>

                <Button
                    title="Logout"
                    onPress={handleLogout}
                    variant="outline"
                    style={[styles.logoutButton, { borderColor: colors.error }]}
                    textStyle={{ color: colors.error }}
                />
            </Animated.View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Change Profile Picture</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <FontAwesome name="times" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalOptions}>
                            <TouchableOpacity style={styles.optionButton} onPress={handleCamera}>
                                <View style={[styles.optionIconContainer, { backgroundColor: colors.background }]}>
                                    <FontAwesome name="camera" size={24} color={colors.primary} />
                                </View>
                                <Text style={[styles.optionText, { color: colors.textPrimary }]}>Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionButton} onPress={handleGallery}>
                                <View style={[styles.optionIconContainer, { backgroundColor: colors.background }]}>
                                    <FontAwesome name="image" size={24} color={colors.primary} />
                                </View>
                                <Text style={[styles.optionText, { color: colors.textPrimary }]}>Gallery</Text>
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
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.successContent}>
                            <FontAwesome name="check-circle" size={60} color={colors.primary} />
                            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Success!</Text>
                            <Text style={[styles.successMessage, { color: colors.textSecondary }]}>Profile picture updated successfully</Text>
                            <TouchableOpacity
                                style={[styles.successButton, { backgroundColor: colors.primary }]}
                                onPress={() => setSuccessVisible(false)}
                            >
                                <Text style={[styles.successButtonText, { color: colors.surface }]}>OK</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    editIcon: {
        fontWeight: 'bold',
        fontSize: 18,
        marginTop: -2,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.l,
    },
    infoCard: {
        borderRadius: 20,
        padding: SPACING.l,
        marginBottom: SPACING.m,
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
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        marginVertical: SPACING.m,
    },
    logoutButton: {
        borderWidth: 1,
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
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    successContent: {
        alignItems: 'center',
        padding: SPACING.m,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: SPACING.m,
        marginBottom: SPACING.s,
    },
    successMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: SPACING.l,
    },
    successButton: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.xl,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    successButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
