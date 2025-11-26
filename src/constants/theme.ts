export const lightTheme = {
    primary: '#FF6B35',
    secondary: '#FFD23F',
    accent: '#00D9FF',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    border: '#E5E7EB',
    placeholder: '#9CA3AF',
    gradient1: '#FF6B35',
    gradient2: '#FFD23F',
    statusBarStyle: 'dark-content' as const,
};

export const darkTheme = {
    primary: '#FF6B35',        // Keep brand color
    secondary: '#FFD23F',      // Keep brand color
    accent: '#00D9FF',
    background: '#121212',     // Dark background
    surface: '#1E1E1E',        // Dark surface
    textPrimary: '#FFFFFF',    // White text
    textSecondary: '#A0A0A0',  // Light gray text
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    border: '#333333',         // Dark border
    placeholder: '#666666',    // Darker placeholder
    gradient1: '#FF6B35',
    gradient2: '#FFD23F',
    statusBarStyle: 'light-content' as const,
};

// Default export for backward compatibility during refactor (points to light theme)
export const COLORS = lightTheme;

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 40,
};

export const FONTS = {
    regular: 'System',
    bold: 'System',
    // In a real app with custom fonts, we would specify font family names here
};

export const SHADOWS = {
    small: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 2,
    },
    medium: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    large: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.51,
        shadowRadius: 13.16,
        elevation: 20,
    }
};
