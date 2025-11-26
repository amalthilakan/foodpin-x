import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, FadeInUp, FadeOutUp, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { SHADOWS, SPACING } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { getAuthHeaders } from '../../src/utils/auth';

let hasShownWelcome = false;

export const resetWelcomeToast = () => {
    hasShownWelcome = false;
};

export default function Home() {
    const { colors, theme } = useTheme();
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
            style={[styles.card, { backgroundColor: colors.surface }]}
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
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>{item.address}</Text>
                {item.rating && (
                    <View style={styles.ratingContainer}>
                        <FontAwesome name="star" size={14} color="#f57f17" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                )}
            </TouchableOpacity>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionButton, { backgroundColor: colors.background }]}>
                    <FontAwesome name="pencil" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id)} style={[styles.actionButton, { backgroundColor: colors.background }]}>
                    <FontAwesome name="trash" size={20} color={colors.error} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <Image
                    source={require('../../assets/images/foodpinlogo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Image
                    source={theme === 'dark'
                        ? require('../../assets/images/foodpin-title-light.png')
                        : require('../../assets/images/foodpin-titled.png')}
                    style={styles.logoText}
                    resizeMode="contain"
                />
            </View>

            {showToast && user && (
                <Animated.View
                    entering={FadeInUp.springify()}
                    exiting={FadeOutUp.springify()}
                    style={[styles.toast, { backgroundColor: colors.surface }]}
                >
                    <Text style={[styles.toastText, { color: colors.primary }]}>
                        Welcome back, {user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : ''}!
                    </Text>
                </Animated.View>
            )}

            {bookmarks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <FontAwesome name="bookmark-o" size={64} color={colors.placeholder} />
                    <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No bookmarks yet</Text>
                    <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
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
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Details</Text>

                        <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                            value={editNotes}
                            onChangeText={setEditNotes}
                            placeholder="Add notes..."
                            placeholderTextColor={colors.placeholder}
                            multiline
                            numberOfLines={4}
                        />

                        <Text style={[styles.label, { color: colors.textSecondary }]}>Social Link</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                            value={editSocialLink}
                            onChangeText={setEditSocialLink}
                            placeholder="https://..."
                            placeholderTextColor={colors.placeholder}
                            autoCapitalize="none"
                            keyboardType="url"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={handleSaveEdit}
                            >
                                <Text style={[styles.saveButtonText, { color: colors.surface }]}>Save</Text>
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
        paddingTop: 0,
        paddingBottom: 0,
        paddingHorizontal: SPACING.l,
        borderBottomWidth: 1,
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
        marginBottom: 4,
    },
    cardAddress: {
        fontSize: 14,
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
    },
    emptySubText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    toast: {
        position: 'absolute',
        top: 100,
        alignSelf: 'center',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        borderRadius: 25,
        zIndex: 100,
        ...SHADOWS.medium,
    },
    toastText: {
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
        borderRadius: 20,
        padding: SPACING.l,
        width: '100%',
        ...SHADOWS.large,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: SPACING.l,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
        marginTop: SPACING.s,
    },
    input: {
        borderRadius: 10,
        padding: SPACING.m,
        fontSize: 14,
        borderWidth: 1,
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
        marginRight: SPACING.s,
    },
    saveButton: {
        marginLeft: SPACING.s,
    },
    cancelButtonText: {
        fontWeight: 'bold',
    },
    saveButtonText: {
        fontWeight: 'bold',
    },
});
