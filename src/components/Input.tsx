import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    hideToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, style, onFocus, onBlur, secureTextEntry, hideToggle, ...props }) => {
    const { colors } = useTheme();
    const isFocused = useSharedValue(0);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(isFocused.value ? colors.primary : colors.border),
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
            {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
            <Animated.View style={[styles.inputContainer, { backgroundColor: colors.surface }, animatedStyle]}>
                <TextInput
                    style={[styles.input, { color: colors.textPrimary }, style]}
                    placeholderTextColor={colors.placeholder}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    {...props}
                />
                {secureTextEntry && !hideToggle && (
                    <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off' : 'eye'}
                            size={24}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </Animated.View>
            {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
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
        marginBottom: SPACING.xs,
        fontWeight: '600',
    },
    inputContainer: {
        borderRadius: 15,
        paddingHorizontal: SPACING.m,
        height: 55,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
        height: '100%',
        flex: 1, // Ensure input takes available space
    },
    eyeIcon: {
        position: 'absolute',
        right: SPACING.m,
    },
    error: {
        fontSize: 12,
        marginTop: SPACING.xs,
    },
});
