import { useEffect, useRef, useState } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';

const MapComponent = ({ center, zoom = 15, markers = [], style = {} }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);

    useEffect(() => {
        const initMap = async () => {
            try {
                const { Map } = await importLibrary("maps");
                // Ensure marker library is loaded for AdvancedMarkerElement
                await importLibrary("marker");

                if (mapRef.current && !map) {
                    const newMap = new Map(mapRef.current, {
                        center: center,
                        zoom: zoom,
                        mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false
                    });
                    setMap(newMap);
                }
            } catch (e) {
                console.error("Error loading Google Maps:", e);
            }
        };

        initMap();
    }, [center, zoom, map]);

    useEffect(() => {
        if (map && markers.length > 0) {
            const addMarkers = async () => {
                try {
                    const { AdvancedMarkerElement } = await importLibrary("marker");

                    markers.forEach((markerData) => {
                        new AdvancedMarkerElement({
                            map,
                            position: markerData.position,
                            title: markerData.title,
                        });
                    });
                } catch (e) {
                    console.error("Error adding markers:", e);
                }
            };
            addMarkers();
        }
    }, [map, markers]);

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
