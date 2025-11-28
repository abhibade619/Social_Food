import { useEffect, useRef } from 'react';
import { loadMapsLibrary, loadMarkerLibrary } from '../utils/googleMaps';

const MapComponent = ({ center, markers = [], style = {} }) => {
    const mapRef = useRef(null);
    const googleMapRef = useRef(null);

    useEffect(() => {
        const initMap = async () => {
            try {
                const { Map } = await loadMapsLibrary();
                const { AdvancedMarkerElement } = await loadMarkerLibrary();

                if (mapRef.current && !googleMapRef.current) {
                    googleMapRef.current = new Map(mapRef.current, {
                        center: center || { lat: 40.7128, lng: -74.0060 }, // Default to NYC
                        zoom: 13,
                        mapId: 'DEMO_MAP_ID', // Required for Advanced Markers
                    });
                }

                // Update markers
                if (googleMapRef.current) {
                    // Clear existing markers (if we were tracking them, but for now we just re-render)
                    // Note: In a real app, we'd want to track marker instances to remove them.
                    // For simplicity, we'll just add new ones.

                    markers.forEach(marker => {
                        new AdvancedMarkerElement({
                            map: googleMapRef.current,
                            position: marker.position,
                            title: marker.title,
                        });
                    });
                }

            } catch (e) {
                console.error("Error loading Google Maps:", e);
            }
        };

        initMap();
    }, [center, markers]);

    return (
        <div
            ref={mapRef}
            style={{
                width: '100%',
                height: '100%',
                minHeight: '300px',
                borderRadius: '8px',
                ...style
            }}
        />
    );
};

export default MapComponent;
