import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { leafletHtml } from './leafletHtml';
import { LeafletMapHandle, LeafletMapProps, ToMapMessage } from './types';
import { useLeafletBridge } from './useLeafletBridge';

export * from './types';

// Web map: the same Leaflet page as native, rendered in an iframe and
// driven through postMessage.
const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>((props, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const post = useCallback((message: ToMapMessage) => {
        iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), '*');
    }, []);

    const { handleMessage } = useLeafletBridge(props, ref, post);

    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (event.source === iframeRef.current?.contentWindow) {
                handleMessage(event.data);
            }
        };
        window.addEventListener('message', onMessage);
        // The iframe may have loaded (and sent "ready") before this listener existed
        post({ type: 'ping' });
        return () => window.removeEventListener('message', onMessage);
    }, [handleMessage, post]);

    return (
        <View style={props.style}>
            <iframe
                ref={iframeRef}
                title="map"
                srcDoc={leafletHtml}
                style={{ border: 0, width: '100%', height: '100%' }}
            />
        </View>
    );
});
LeafletMap.displayName = 'LeafletMap';

export default LeafletMap;
