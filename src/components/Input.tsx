import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { COLORS, SPACING } from '../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, onFocus, onBlur, secureTextEntry, ...props }) => {
    const isFocused = useSharedValue(0);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(isFocused.value ? COLORS.primary : COLORS.border),
            borderWidth: withTiming(isFocused.value ? 2 : 1),
        };
    });

    const handleFocus = (e: any) => {
        isFocused.value = 1;
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e: any) => {
        isFocused.value = 0;
        if (onBlur) onBlur(e);
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Animated.View style={[styles.inputContainer, animatedStyle]}>
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={COLORS.placeholder}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    {...props}
                />
                {secureTextEntry && (
                    <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off' : 'eye'}
                            size={24}
                            color={COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </Animated.View>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.m,
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
        fontWeight: '600',
    },
    inputContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 15,
        paddingHorizontal: SPACING.m,
        height: 55,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
        color: COLORS.textPrimary,
        height: '100%',
        flex: 1, // Ensure input takes available space
    },
    eyeIcon: {
        position: 'absolute',
        right: SPACING.m,
    },
    error: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: SPACING.xs,
    },
});
