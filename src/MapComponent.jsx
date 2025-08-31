    // MapComponent.jsx
    import React from 'react';
    import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

    const mapContainerStyle = {
      width: '100%',
      height: '400px', // Example height, adjust with Tailwind classes
    };

    const center = {
      lat: -3.745,
      lng: -38.523,
    };

    const MapComponent = () => {
      const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ['places'], // Optional: for place search functionality
      });

      if (loadError) return "Error loading maps";
      if (!isLoaded) return "Loading Maps";

      return (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={10}
          className="rounded-lg shadow-md" // Example Tailwind classes
        >
          {/* Optional: Add markers */}
          <Marker position={center} />
        </GoogleMap>
      );
    };

    export default MapComponent;