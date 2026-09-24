let hasShownWelcome = false;

export const shouldShowWelcomeToast = () => {
    if (hasShownWelcome) return false;
    hasShownWelcome = true;
    return true;
};

export const resetWelcomeToast = () => {
    hasShownWelcome = false;
};
