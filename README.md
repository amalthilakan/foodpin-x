# FoodPin 🍔📍

A modern, beautiful restaurant discovery and review application built with React Native and Expo. FoodPin helps you find the best places to eat, view details, and manage your favorite spots with a premium user experience.

## ✨ Features

- **🔐 User Authentication**: Secure Login and Signup functionality with JWT authentication.
- **🗺️ Interactive Maps**: Integrated Google Maps to visualize restaurant locations.
- **🔍 Smart Search**: Search for restaurants by name or cuisine with real-time results.
- **👤 User Profiles**: Manage your profile, view saved restaurants, and update settings.
- **🎨 Modern UI/UX**:
  - Sleek, minimalist design with glassmorphism elements.
  - Smooth animations using `react-native-reanimated`.
  - **Dark Mode** & **Light Mode** support with dynamic theming.
- **📱 Responsive**: Optimized for both Android and iOS devices.

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 52)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling**: `StyleSheet`, Custom Theme Context
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Maps**: [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- **Networking**: [Axios](https://axios-http.com/)
- **Storage**: [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app on your mobile device (or an Android Emulator / iOS Simulator)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/foodpin.git
    cd foodpin
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Environment Setup**

    Create a `.env` file in the root directory and add your Google Maps API Key:

    ```env
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
    ```

### Running the App

Start the development server:

```bash
npx expo start
```

- **Scan the QR code** with the Expo Go app (Android) or Camera app (iOS).
- Press `a` to open in **Android Emulator**.
- Press `i` to open in **iOS Simulator**.
- Press `w` to open in **Web Browser**.

## 📂 Project Structure

```
foodpin/
├── app/                 # Expo Router pages (Screens)
│   ├── (tabs)/          # Main tab navigation (Home, Search, Profile)
│   ├── _layout.tsx      # Root layout configuration
│   └── index.tsx        # Entry point (Login/Welcome)
├── src/
│   ├── components/      # Reusable UI components (Button, Input, etc.)
│   ├── constants/       # Theme colors and configuration
│   ├── context/         # React Context (Theme, Auth)
│   ├── services/        # API service calls
│   └── utils/           # Helper functions
├── assets/              # Images and fonts
└── app.config.ts        # Expo configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
