import React, { forwardRef, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { leafletHtml } from './leafletHtml';
import { LeafletMapHandle, LeafletMapProps, ToMapMessage } from './types';
import { useLeafletBridge } from './useLeafletBridge';

export * from './types';

// Native map: Leaflet + OpenStreetMap tiles inside a WebView.
// Web uses index.web.tsx (iframe), since react-native-webview has no web support.
const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>((props, ref) => {
    const webViewRef = useRef<WebView>(null);

    const post = useCallback((message: ToMapMessage) => {
        webViewRef.current?.injectJavaScript(`window.handleMessage(${JSON.stringify(message)}); true;`);
    }, []);

    const { handleMessage, resetReady } = useLeafletBridge(props, ref, post);

    return (
        <View style={props.style}>
            <WebView
                ref={webViewRef}
                source={{ html: leafletHtml }}
                originWhitelist={['*']}
                onMessage={(event) => handleMessage(event.nativeEvent.data)}
                onLoadStart={resetReady}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                style={{ flex: 1 }}
            />
        </View>
    );
});
LeafletMap.displayName = 'LeafletMap';

export default LeafletMap;
