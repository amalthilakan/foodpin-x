import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING } from '../../src/constants/theme';
import { getAuthHeaders } from '../../src/utils/auth';

export default function RestaurantDetails() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id, name, address, rating, latitude, longitude, notes: initialNotes, socialLink: initialSocialLink } = params;

    const [notes, setNotes] = useState(initialNotes as string || '');
    const [socialLink, setSocialLink] = useState(initialSocialLink as string || '');
    const [isEditing, setIsEditing] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);

    React.useEffect(() => {
        if (successVisible) {
            const timer = setTimeout(() => {
                setSuccessVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successVisible]);

    const handleGetDirections = () => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${latitude},${longitude}`;
        const label = name as string;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url).catch(() => {
                const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                Linking.openURL(webUrl);
            });
        }
    };

    const handleSave = async () => {
        try {
            const headers = await getAuthHeaders();
            await axios.put(`/bookmarks/${id}`, { notes, socialLink }, headers);
            setIsEditing(false);
            setSuccessVisible(true);
        } catch (error) {
            Alert.alert('Error', 'Failed to save details');
        }
    };

    const handleOpenSocialLink = () => {
        if (socialLink) {
            Linking.openURL(socialLink).catch(() => {
                Alert.alert('Error', 'Could not open link');
            });
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Restaurant Details</Text>
                <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)} style={styles.editButton}>
                    <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
                <View style={styles.card}>
                    <Text style={styles.title}>{name}</Text>
                    <Text style={styles.address}>{address}</Text>

                    {rating && (
                        <View style={styles.ratingContainer}>
                            <FontAwesome name="star" size={18} color="#f57f17" />
                            <Text style={styles.ratingText}>{rating}</Text>
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Add notes about this place..."
                                multiline
                                numberOfLines={4}
                            />
                        ) : (
                            <Text style={styles.text}>{notes || 'No notes added yet.'}</Text>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Social Media Link</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={socialLink}
                                onChangeText={setSocialLink}
                                placeholder="https://instagram.com/..."
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        ) : (
                            socialLink ? (
                                <TouchableOpacity onPress={handleOpenSocialLink}>
                                    <Text style={styles.link}>{socialLink}</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.text}>No link added yet.</Text>
                            )
                        )}
                    </View>

                    <TouchableOpacity style={styles.directionButton} onPress={handleGetDirections}>
                        <FontAwesome name="location-arrow" size={20} color={COLORS.surface} />
                        <Text style={styles.directionButtonText}>Get Directions</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

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
                            <Text style={styles.successMessage}>Details saved successfully</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.s,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    editButton: {
        padding: SPACING.s,
    },
    editButtonText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: SPACING.l,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.xl,
        ...SHADOWS.medium,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.s,
        textAlign: 'center',
    },
    address: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: SPACING.l,
        textAlign: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff9c4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: SPACING.xl,
    },
    ratingText: {
        marginLeft: 6,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f57f17',
    },
    section: {
        width: '100%',
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.s,
    },
    text: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
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
        height: 100,
        textAlignVertical: 'top',
    },
    link: {
        fontSize: 14,
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    directionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.m,
        borderRadius: 12,
        marginTop: SPACING.m,
        ...SHADOWS.small,
    },
    directionButtonText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: SPACING.s,
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
