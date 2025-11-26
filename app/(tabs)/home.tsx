import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, FadeInUp, FadeOutUp, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { COLORS, SHADOWS, SPACING } from '../../src/constants/theme';
import { getAuthHeaders } from '../../src/utils/auth';

let hasShownWelcome = false;

export const resetWelcomeToast = () => {
    hasShownWelcome = false;
};

export default function Home() {
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [showToast, setShowToast] = useState(false);

    // Edit Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editNotes, setEditNotes] = useState('');
    const [editSocialLink, setEditSocialLink] = useState('');

    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                const isAuthenticated = await checkUser();
                if (isAuthenticated) {
                    fetchBookmarks();
                }
            };
            init();
        }, [])
    );

    const checkUser = async () => {
        const userData = await SecureStore.getItemAsync('user');
        if (!userData) {
            router.replace('/');
            return false;
        } else {
            setUser(JSON.parse(userData));
            if (!hasShownWelcome) {
                setShowToast(true);
                hasShownWelcome = true;
                setTimeout(() => setShowToast(false), 3000);
            }
            return true;
        }
    };

    const fetchBookmarks = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get('/bookmarks', headers);
            setBookmarks(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const headers = await getAuthHeaders();
            await axios.delete(`/bookmarks/${id}`, headers);
            setBookmarks((prev) => prev.filter((b) => b._id !== id));
        } catch (error) {
            Alert.alert('Error', 'Failed to delete bookmark');
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setEditNotes(item.notes || '');
        setEditSocialLink(item.socialLink || '');
        setModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;

        try {
            const updatedData = { notes: editNotes, socialLink: editSocialLink };
            const headers = await getAuthHeaders();
            await axios.put(`/bookmarks/${editingItem._id}`, updatedData, headers);

            setBookmarks(prev => prev.map(b =>
                b._id === editingItem._id ? { ...b, ...updatedData } : b
            ));

            setModalVisible(false);
            setEditingItem(null);
            Alert.alert('Success', 'Bookmark updated successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to update bookmark');
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View
            entering={FadeInRight.delay(index * 100).springify()}
            layout={Layout.springify()}
            style={styles.card}
        >
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => router.push({
                    pathname: '/restaurant/[id]',
                    params: {
                        id: item._id,
                        name: item.name,
                        address: item.address,
                        rating: item.rating,
                        latitude: item.location.latitude,
                        longitude: item.location.longitude,
                        notes: item.notes,
                        socialLink: item.socialLink
                    }
                })}
            >
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardAddress}>{item.address}</Text>
                {item.rating && (
                    <View style={styles.ratingContainer}>
                        <FontAwesome name="star" size={14} color="#f57f17" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                )}
            </TouchableOpacity>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                    <FontAwesome name="pencil" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionButton}>
                    <FontAwesome name="trash" size={20} color={COLORS.error} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Image
                    source={require('../../assets/images/foodpinlogo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Image
                    source={require('../../assets/images/foodpin-titled.png')}
                    style={styles.logoText}
                    resizeMode="contain"
                />
            </View>

            {showToast && user && (
                <Animated.View
                    entering={FadeInUp.springify()}
                    exiting={FadeOutUp.springify()}
                    style={styles.toast}
                >
                    <Text style={styles.toastText}>Welcome back, {user.username}!</Text>
                </Animated.View>
            )}

            {bookmarks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <FontAwesome name="bookmark-o" size={64} color={COLORS.placeholder} />
                    <Text style={styles.emptyText}>No bookmarks yet</Text>
                    <Text style={styles.emptySubText}>
                        Go to the Search tab to find and save your favorite restaurants!
                    </Text>
                    <Button
                        title="Start Exploring"
                        onPress={() => router.push('/(tabs)/search')}
                        style={{ marginTop: SPACING.l, width: 'auto' }}
                    />
                </View>
            ) : (
                <FlatList
                    data={bookmarks}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Details</Text>

                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={editNotes}
                            onChangeText={setEditNotes}
                            placeholder="Add notes..."
                            multiline
                            numberOfLines={4}
                        />

                        <Text style={styles.label}>Social Link</Text>
                        <TextInput
                            style={styles.input}
                            value={editSocialLink}
                            onChangeText={setEditSocialLink}
                            placeholder="https://..."
                            autoCapitalize="none"
                            keyboardType="url"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveEdit}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
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
    header: {
        paddingTop: 0,
        paddingBottom: 0,
        paddingHorizontal: SPACING.l,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 80, // Explicit height to constrain the header
    },
    logo: {
        width: 60,
        height: 60,
    },
    logoText: {
        width: 130,
        height: 60,
    },
    listContainer: {
        padding: SPACING.l,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    cardContent: {
        flex: 1,
        marginRight: SPACING.s,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    cardAddress: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.s,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff9c4',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#f57f17',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 10,
        marginLeft: SPACING.s,
        backgroundColor: COLORS.background,
        borderRadius: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: SPACING.l,
        marginBottom: SPACING.s,
        color: COLORS.textPrimary,
    },
    emptySubText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    toast: {
        position: 'absolute',
        top: 100,
        alignSelf: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        borderRadius: 25,
        zIndex: 100,
        ...SHADOWS.medium,
    },
    toastText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
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
        ...SHADOWS.large,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.l,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
        marginTop: SPACING.s,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 10,
        padding: SPACING.m,
        fontSize: 14,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.xl,
    },
    modalButton: {
        flex: 1,
        padding: SPACING.m,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.background,
        marginRight: SPACING.s,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        marginLeft: SPACING.s,
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: COLORS.surface,
        fontWeight: 'bold',
    },
});
