import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, Modal, TouchableOpacity, Text, ScrollView, StatusBar, Switch } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { LineChart } from 'react-native-chart-kit';
import { Audio } from 'expo-av';
import { SwipeablePanel } from 'rn-swipeable-panel';
import Constants from 'expo-constants';

const googleApiKey = Constants.expoConfig?.extra?.googleApiKey || 'default_key';

console.log('Google API Key:', googleApiKey);

const MapComponent = () => {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [showEarnings, setShowEarnings] = useState(false);
  const [activeTextVisible, setActiveTextVisible] = useState(false);
  const [showLocation, setShowLocation] = useState(true);
  const [theme, setTheme] = useState('default');
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHotZoneButton, setShowHotZoneButton] = useState(true);
  const [sound, setSound] = useState();
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [panelActive, setPanelActive] = useState(false);
  const [servicePanelActive, setServicePanelActive] = useState(false);
  const [serviceSwitches, setServiceSwitches] = useState([false, false, false]);

  const defaultMarkers = [
    { latitude: 9.548194, longitude: -69.208548 },
    { latitude: 9.575365, longitude: -69.214375 },
    { latitude: 9.564832, longitude: -69.202236 },
  ];

  const serviceImages = [
    require('./assets/migo.png'),
    require('./assets/migo.png'),
    require('./assets/migo.png'),
  ];

  const serviceTitles = ['Económico', 'Confort', 'Mascota'];

  const playSound = async (soundFile) => {
    if (isSoundEnabled) {
      const { sound } = await Audio.Sound.createAsync(soundFile);
      setSound(sound);
      await sound.playAsync();
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setVehicleLocation(location.coords);
      setLoading(false);
    };

    getLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const mapStyle = theme === 'dark' ? darkMapStyle : theme === 'pink' ? pinkMapStyle : [];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent={true} />
      <MapView
        ref={(ref) => { this.mapView = ref; }}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={showLocation}
        customMapStyle={mapStyle}
      >
        {vehicleLocation && showLocation && (
          <Marker
            coordinate={vehicleLocation}
            title={"Ubicación del Vehículo"}
            description={"Aquí está tu vehículo"}
          >
            <Image
              source={require('./assets/migo.png')}
              style={styles.vehicleImage}
              resizeMode="contain"
            />
          </Marker>
        )}

        {showMarkers && defaultMarkers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={marker}
            title={`Punto Fucsia ${index + 1}`}
            description={`Descripción del punto ${index + 1}`}
            pinColor="fuchsia"
          />
        ))}
      </MapView>

      <View style={styles.overlay} />

      <TouchableOpacity style={styles.profileImageContainer} onPress={() => setModalVisible(true)}>
        <Image
          source={require('./assets/profile.png')}
          style={styles.profileImage}/>
      </TouchableOpacity>

      {activeTextVisible && (
        <Text style={styles.activeText}>Activo</Text>
      )}
      {!activeTextVisible && (
        <TouchableOpacity 
          style={styles.goButton} 
          onPress={() => {
            playSound(require('./assets/sound.mp3'));
            setActiveTextVisible(true);
            setShowLocation(true);
            setShowHotZoneButton(true);
            setServicePanelActive(false); // Ocultar el panel de servicios

            if (region) {
              const newRegion = {
                ...region,
                latitudeDelta: 0.001,
                longitudeDelta: 0.001,
              };
              this.mapView.animateToRegion(newRegion, 1000);
              this.mapView.animateCamera({ pitch: 45 }, { duration: 1000 });
            }
          }} 
        >
          <Text style={styles.goButtonText}>Go</Text>
        </TouchableOpacity>
      )}
      {activeTextVisible && (
        <TouchableOpacity 
          style={styles.sleepButton} 
          onPress={() => {
            playSound(require('./assets/sleepSound.mp3'));
            setShowLocation(false);
            setActiveTextVisible(false);
            setShowHotZoneButton(false);

            if (region) {
              const newRegion = {
                ...region,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              };
              this.mapView.animateToRegion(newRegion, 1000);
              this.mapView.animateCamera({ pitch: 0 }, { duration: 1000 });
            }
          }} 
        >
          <Text style={styles.sleepButtonText}>Dormir</Text>
        </TouchableOpacity>
      )}

      {/* Botón flotante de configuración con una "C" */}
      <TouchableOpacity 
        style={styles.configFloatingButton} 
        onPress={() => setPanelActive(true)}
      >
        <Text style={styles.floatingButtonText}>C</Text>
      </TouchableOpacity>

      {/* Botón flotante de servicios con una "S" */}
      <TouchableOpacity 
        style={styles.serviceFloatingButton} 
        onPress={() => setServicePanelActive(true)}
      >
        <Text style={styles.floatingButtonText}>S</Text>
      </TouchableOpacity>

      <SwipeablePanel
        fullWidth
        isActive={panelActive}
        onClose={() => setPanelActive(false)}
        onPressCloseButton={() => setPanelActive(false)}
        style={theme === 'pink' ? styles.pinkPanel : {}}
      >
        <View style={styles.panelContent}>
          <TouchableOpacity onPress={() => setIsSoundEnabled(!isSoundEnabled)}>
            <Text style={styles.panelText}>
              {isSoundEnabled ? 'Desactivar Sonido' : 'Activar Sonido'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTheme(theme === 'dark' ? 'default' : 'dark')}>
            <Text style={styles.panelText}>
              {theme === 'dark' ? 'Tema Claro' : 'Tema Oscuro'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTheme(theme === 'pink' ? 'default' : 'pink')}>
            <Text style={styles.panelText}>
              {theme === 'pink' ? 'Tema Predeterminado' : 'Tema Rosa'}
            </Text>
          </TouchableOpacity>
        </View>
      </SwipeablePanel>

      <SwipeablePanel
        fullWidth
        isActive={servicePanelActive}
        onClose={() => setServicePanelActive(false)}
        onPressCloseButton={() => setServicePanelActive(false)}
      >
        <View style={styles.panelContent}>
          <Text style={styles.panelText}>Selecciona los tipos de servicios activar</Text>
          {serviceImages.map((image, index) => (
            <View key={index} style={styles.serviceItem}>
              <Image source={image} style={styles.serviceImage} />
              <Text style={styles.serviceTitle}>{serviceTitles[index]}</Text>
              <Switch
                style={styles.serviceSwitch}
                value={serviceSwitches[index]}
                onValueChange={(value) => {
                  const newSwitches = [...serviceSwitches];
                  newSwitches[index] = value;
                  setServiceSwitches(newSwitches);
                }}
              />
            </View>
          ))}
        </View>
      </SwipeablePanel>

      <TouchableOpacity 
        style={styles.floatingButton} 
        onPress={() => {
          // Aquí puedes definir la acción que deseas al presionar el botón
          console.log('Botón flotante presionado');
        }}
      >
        <Text style={styles.floatingButtonText}>V</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 100,
    backgroundColor: 'transparent',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'absolute',
    top: 30,
    left: 20,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'red',
  },
  profileImage: {
    width: 50,
    height: 50,
    resizeMode: 'cover',
  },
  modalView: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    fontSize: 24,
    color: '#cb2daa',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
  },
  menuText: {
    fontSize: 16,
  },
  earningsContainer: {
    padding: 15,
  },
  earningsText: {
    fontSize: 16,
    marginBottom: 10,
  },
  activeText: {
    position: 'absolute',
    top: 45,
    alignSelf: 'center',
    color: 'green',
    fontSize: 24,
    fontWeight: 'bold',
  },
  goButton: {
    position: 'absolute',
    top: '50%', // Centrado verticalmente
    left: '50%', // Centrado horizontalmente
    transform: [{ translateX: -70 }, { translateY: -40 }], // Ajuste para centrar el botón
    backgroundColor: 'green',
    padding: 20, // Aumenta el padding para hacer el botón más grande
    borderRadius: 35,
    width: 130, // Ancho específico del botón
    height: 130, // Alto específico del botón
  },
  goButtonText: {
    color: 'white',
    fontSize: 60, // Aumenta el tamaño de la fuente
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sleepButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  sleepButtonText: {
    color: 'white',
    fontSize: 18,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100, // Ajusta la altura según sea necesario
    backgroundColor: 'rgba(244, 6, 129, 0.4)', // Color blanco semi-transparente
    zIndex: 0, // Asegúrate de que esté detrás de otros elementos
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  hotZoneButton: {
    position: 'absolute',
    bottom: 20, // Distancia desde la parte inferior
    left: 20, // Distancia desde la izquierda
    backgroundColor: 'yellow', // Color de fondo amarillo
    padding: 10,
    borderRadius: 5,
  },
  hotZoneButtonText: {
    color: 'black', // Color del texto
    fontSize: 16,
  },
  panelButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  servicePanelButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
  },
  panelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  panelContent: {
    padding: 20,
  },
  panelText: {
    fontSize: 18,
    marginBottom: 10,
  },
  pinkPanel: {
    backgroundColor: 'fuchsia',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  serviceImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  serviceTitle: {
    fontSize: 16,
    flex: 1,
  },
  serviceSwitch: {
    marginLeft: 'auto',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80, // Ajusta la posición vertical
    right: 20, // Ajusta la posición horizontal
    backgroundColor: 'blue', // Color de fondo del botón
    width: 60, // Ancho del botón
    height: 60, // Alto del botón
    borderRadius: 30, // Hace el botón redondo
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Añade sombra en Android
    shadowColor: '#000', // Añade sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  floatingButtonText: {
    color: 'white', // Color del texto
    fontSize: 24, // Tamaño del texto
    fontWeight: 'bold',
  },
  serviceFloatingButton: {
    position: 'absolute',
    bottom: 20, // Ajusta la posición vertical
    left: 20, // Ajusta la posición horizontal
    backgroundColor: 'green', // Color de fondo del botón
    width: 60, // Ancho del botón
    height: 60, // Alto del botón
    borderRadius: 30, // Hace el botón redondo
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Añade sombra en Android
    shadowColor: '#000', // Añade sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  configFloatingButton: {
    position: 'absolute',
    bottom: 20, // Ajusta la posición vertical
    right: 20, // Ajusta la posición horizontal
    backgroundColor: 'blue', // Color de fondo del botón
    width: 60, // Ancho del botón
    height: 60, // Alto del botón
    borderRadius: 30, // Hace el botón redondo
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Añade sombra en Android
    shadowColor: '#000', // Añade sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});

const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#212121' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#212121' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#181818' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1b1b1b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#4e4e4e' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
  },
];

const pinkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f8bbd0' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#000000' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f8bbd0' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#f48fb1' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#f8bbd0' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f06292' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#f48fb1' }],
  },
];

export default MapComponent;
