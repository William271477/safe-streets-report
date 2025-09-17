import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    lng: number;
    lat: number;
    title: string;
    category: string;
  }>;
  onMapClick?: (lng: number, lat: number) => void;
  className?: string;
}

const Map: React.FC<MapProps> = ({ 
  center = [0, 0], 
  zoom = 2, 
  markers = [], 
  onMapClick,
  className = "w-full h-64"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Set Mapbox access token from secret
    mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbGlhbTI1MjUiLCJhIjoiY21mbzh6a2liMDMzOTJrczh3c3RvbXIzbyJ9.3UGW712TITnGkuIZ020mDw';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: center,
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add click handler if provided
    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick(e.lngLat.lng, e.lngLat.lat);
      });
    }

    // Cleanup function
    return () => {
      // Remove existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      if (map.current) {
        map.current.remove();
      }
    };
  }, [center, zoom, onMapClick]);

  // Update markers when they change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const markerElement = document.createElement('div');
      markerElement.className = 'w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg';
      
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([markerData.lng, markerData.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-sm">${markerData.title}</h3>
                <p class="text-xs text-muted-foreground">${markerData.category}</p>
              </div>
            `)
        )
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default Map;