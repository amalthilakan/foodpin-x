import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar, StatusBarStyle } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeType;
    colors: typeof lightTheme | typeof darkTheme;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeType>('light');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme) {
                setThemeState(savedTheme as ThemeType);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    };

    const setTheme = async (newTheme: ThemeType) => {
        try {
            setThemeState(newTheme);
            await AsyncStorage.setItem('theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const colors = theme === 'light' ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
            <StatusBar
                barStyle={colors.statusBarStyle as StatusBarStyle}
                backgroundColor={colors.background}
            />
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
