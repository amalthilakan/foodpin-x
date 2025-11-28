import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHADOWS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface CustomModalProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export const CustomModal: React.FC<CustomModalProps> = ({
    visible,
    title,
    message,
    type = 'info',
    onClose,
}) => {
    const { colors } = useTheme();

    const getIconName = () => {
        switch (type) {
            case 'success':
                return 'check-circle';
            case 'error':
                return 'exclamation-circle';
            default:
                return 'info-circle';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'success':
                return colors.primary; // Or a specific success color if defined
            case 'error':
                return colors.error;
            default:
                return colors.primary;
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.contentContainer}>
                        <FontAwesome name={getIconName()} size={50} color={getIconColor()} />
                        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
                        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: getIconColor() }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.buttonText, { color: colors.surface }]}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
    contentContainer: {
        alignItems: 'center',
        padding: SPACING.s,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: SPACING.m,
        marginBottom: SPACING.s,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: SPACING.l,
        lineHeight: 22,
    },
    button: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.xl,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
