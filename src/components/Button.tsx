import React from 'react';
import { StyleSheet, Text, TouchableOpacityProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COLORS, SPACING } from '../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'outline' | 'ghost';
    loading?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(React.Component);

// Since createAnimatedComponent with TouchableOpacity can be tricky with types and refs, 
// we'll implement a simple Pressable-like behavior using a View and gesture handlers 
// or just wrap TouchableOpacity and animate its style.
// A simpler approach for "scale on press" is to use `useAnimatedStyle`.

import { Pressable } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({ title, variant = 'primary', style, loading, ...props }) => {
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
        if (props.disabled) return COLORS.placeholder;
        switch (variant) {
            case 'primary': return COLORS.primary;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return COLORS.primary;
        }
    };

    const getTextColor = () => {
        if (props.disabled) return COLORS.surface;
        switch (variant) {
            case 'primary': return COLORS.surface;
            case 'outline': return COLORS.primary;
            case 'ghost': return COLORS.primary;
            default: return COLORS.surface;
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
                    borderColor: COLORS.primary,
                    borderWidth: getBorderWidth(),
                },
                animatedStyle,
                style
            ]}
            {...props}
        >
            <Text style={[styles.text, { color: getTextColor() }]}>
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
