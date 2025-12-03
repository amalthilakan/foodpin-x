import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SHADOWS, SPACING } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { getAuthHeaders } from '../../src/utils/auth';

export default function RestaurantDetails() {
    const { colors } = useTheme();
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Restaurant Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>


                    <Text style={[styles.title, { color: colors.textPrimary }]}>{name}</Text>
                    <Text style={[styles.address, { color: colors.textSecondary }]}>{address}</Text>

                    {rating && (
                        <View style={styles.ratingContainer}>
                            <FontAwesome name="star" size={18} color="#f57f17" />
                            <Text style={styles.ratingText}>{rating}</Text>
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notes</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Add notes about this place..."
                                placeholderTextColor={colors.placeholder}
                                multiline
                                numberOfLines={4}
                            />
                        ) : (
                            <Text style={[styles.text, { color: colors.textSecondary }]}>{notes || 'No notes added yet.'}</Text>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Social Media Link</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                value={socialLink}
                                onChangeText={setSocialLink}
                                placeholder="https://instagram.com/..."
                                placeholderTextColor={colors.placeholder}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        ) : (
                            socialLink ? (
                                <TouchableOpacity onPress={handleOpenSocialLink}>
                                    <Text style={[styles.link, { color: colors.primary }]}>{socialLink}</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={[styles.text, { color: colors.textSecondary }]}>No link added yet.</Text>
                            )
                        )}
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.primary, borderWidth: 1, marginRight: SPACING.m }]}
                        >
                            <Text style={[styles.actionButtonText, { color: colors.primary }]}>{isEditing ? 'Save' : 'Edit'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.directionButton, { backgroundColor: colors.primary }]} onPress={handleGetDirections}>
                            <FontAwesome name="location-arrow" size={20} color={colors.surface} />
                            <Text style={[styles.directionButtonText, { color: colors.surface }]}>Get Directions</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

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
                            <Text style={[styles.successMessage, { color: colors.textSecondary }]}>Details saved successfully</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: SPACING.s,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    editButton: {
        padding: SPACING.s,
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: SPACING.l,
    },
    card: {
        borderRadius: 20,
        padding: SPACING.xl,
        ...SHADOWS.medium,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
        textAlign: 'center',
        marginTop: SPACING.m,
    },
    address: {
        fontSize: 16,
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
        marginBottom: SPACING.s,
    },
    text: {
        fontSize: 14,
        lineHeight: 20,
    },
    input: {
        borderRadius: 10,
        padding: SPACING.m,
        fontSize: 14,
        borderWidth: 1,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    link: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.m,
        width: '100%',
    },
    actionButton: {
        padding: SPACING.m,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.small,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    directionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.m,
        borderRadius: 12,
        ...SHADOWS.small,
    },
    directionButtonText: {
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
