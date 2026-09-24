// Native (iOS/Android) map. Web uses Map.web.tsx, because react-native-maps
// imports native-only modules that can't be bundled for web.
export { default, Marker } from 'react-native-maps';
export type { Region } from 'react-native-maps';
