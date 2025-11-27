import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "foodpin",
    slug: "foodpin",
    version: "1.0.3",
    orientation: "portrait",
    icon: "./assets/images/foodpinlogo.png",
    scheme: "foodpin",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
        supportsTablet: true,
        config: {
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        }
    },
    android: {
        adaptiveIcon: {
            backgroundColor: "#E6F4FE",
            foregroundImage: "./assets/images/foreground.png",
            backgroundImage: "./assets/images/background.png",
            monochromeImage: "./assets/images/android-icon-monochrome.png"
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: "com.amalthilakan.foodpin",
        config: {
            googleMaps: {
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            }
        }
    },
    web: {
        output: "static",
        favicon: "./assets/images/foodpinlogo.png"
    },
    plugins: [
        "expo-router",
        [
            "expo-splash-screen",
            {
                "image": "./assets/images/splash.png",
                "imageWidth": 200,
                "resizeMode": "contain",
                "backgroundColor": "#ffffff",
                "dark": {
                    "backgroundColor": "#000000"
                }
            }
        ]
    ],
    experiments: {
        typedRoutes: true,
        reactCompiler: true
    },
    extra: {
        router: {},
        eas: {
            projectId: "f1f2e682-5038-4ce3-ad89-b5aef44da52d"
        }
    },
    owner: "amalthilakan"
});
