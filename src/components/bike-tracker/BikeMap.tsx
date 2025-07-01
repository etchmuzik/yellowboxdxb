
import React from "react";
import { BikeMapProps } from "./types";
import { useGoogleMapsApi } from "@/hooks/use-google-maps-api";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { MapPin, AlertTriangle, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Dubai center coordinates
const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 };

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem'
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
};

export const BikeMap: React.FC<BikeMapProps> = ({ riders, selectedRiderId, onRiderSelect }) => {
  const { apiKey, isLoaded, isError } = useGoogleMapsApi();
  const navigate = useNavigate();
  const [openInfoWindowId, setOpenInfoWindowId] = React.useState<string | null>(null);

  // Handle clicking on a marker
  const handleMarkerClick = (riderId: string) => {
    onRiderSelect(riderId);
    setOpenInfoWindowId(riderId);
  };

  // Go to settings page to set API key
  const goToSettings = () => {
    navigate('/settings');
  };

  // If there's an error loading the API key
  if (isError || !apiKey) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <AlertTriangle className="w-12 h-12 text-yellowbox-yellow mb-2" />
        <h3 className="text-lg font-medium text-gray-800">Google Maps API Key Not Found</h3>
        <p className="text-gray-600 max-w-md">
          To view the interactive map, you need to configure a Google Maps API key in settings.
        </p>
        <Button onClick={goToSettings}>
          Configure API Key
        </Button>
      </div>
    );
  }

  // If still loading API key
  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellowbox-yellow"></div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={DUBAI_CENTER}
        zoom={11}
        options={mapOptions}
      >
        {riders.map((rider) => (
          <Marker
            key={rider.riderId}
            position={{ lat: rider.latitude, lng: rider.longitude }}
            onClick={() => handleMarkerClick(rider.riderId)}
            icon={{
              path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
              fillColor: rider.status === 'Active' ? '#10B981' : rider.status === 'Idle' ? '#F59E0B' : '#6B7280',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 1.2,
            }}
            animation={window.google?.maps?.Animation?.DROP}
          />
        ))}

        {openInfoWindowId && (
          <InfoWindow
            position={{
              lat: riders.find(r => r.riderId === openInfoWindowId)?.latitude || DUBAI_CENTER.lat,
              lng: riders.find(r => r.riderId === openInfoWindowId)?.longitude || DUBAI_CENTER.lng
            }}
            onCloseClick={() => setOpenInfoWindowId(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-semibold text-gray-800">
                {riders.find(r => r.riderId === openInfoWindowId)?.riderName}
              </h3>
              <div className="mt-1 space-y-1 text-sm">
                <div className="flex items-center">
                  <Bike className="h-3 w-3 mr-1 text-yellowbox-yellow" />
                  <span className="text-gray-600">
                    {riders.find(r => r.riderId === openInfoWindowId)?.bikeModel || 
                     riders.find(r => r.riderId === openInfoWindowId)?.bikeType}
                  </span>
                </div>
                {riders.find(r => r.riderId === openInfoWindowId)?.bikeRegistration && (
                  <div className="text-gray-600">
                    Reg: {riders.find(r => r.riderId === openInfoWindowId)?.bikeRegistration}
                  </div>
                )}
                {riders.find(r => r.riderId === openInfoWindowId)?.gpsTrackerId && (
                  <div className="text-gray-600">
                    GPS: {riders.find(r => r.riderId === openInfoWindowId)?.gpsTrackerId}
                  </div>
                )}
                <div className="text-gray-600">
                  {riders.find(r => r.riderId === openInfoWindowId)?.district}
                </div>
                <div className="text-gray-600">
                  Speed: {riders.find(r => r.riderId === openInfoWindowId)?.speed} km/h
                </div>
              </div>
              <div className="mt-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                  riders.find(r => r.riderId === openInfoWindowId)?.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : riders.find(r => r.riderId === openInfoWindowId)?.status === 'Idle' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {riders.find(r => r.riderId === openInfoWindowId)?.status}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};
