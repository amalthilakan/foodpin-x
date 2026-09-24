import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacityProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'outline' | 'ghost';
    loading?: boolean;
    textStyle?: StyleProp<TextStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({ title, variant = 'primary', style, textStyle, loading, disabled, ...props }) => {
    const { colors } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const onPressIn = () => {
        scale.value = withSpring(0.95);
    };

    const onPressOut = () => {
        scale.value = withSpring(1);
    };

    const getBackgroundColor = () => {
        if (disabled) return colors.placeholder;
        switch (variant) {
            case 'primary': return colors.primary;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.surface;
        switch (variant) {
            case 'primary': return colors.surface;
            case 'outline': return colors.primary;
            case 'ghost': return colors.primary;
            default: return colors.surface;
        }
    };

    const getBorderWidth = () => {
        return variant === 'outline' ? 1 : 0;
    };

    return (
        <AnimatedPressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: colors.primary,
                    borderWidth: getBorderWidth(),
                },
                animatedStyle,
                style
            ]}
            {...props}
            // Prevent duplicate submissions while a request is in flight
            disabled={disabled || loading}
        >
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                {loading ? 'Loading...' : title}
            </Text>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    text: {
        fontSize: 17,
        fontWeight: 'bold',
    },
});
