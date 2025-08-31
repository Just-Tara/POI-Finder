    // App.js
    import React from 'react';
    import MapComponent from './MapComponent';

    function App() {
      return (
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-4">My Google Map</h1>
          <MapComponent />
        </div>
      );
    }

    export default App;