import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "es.buscaycurra.app",
  appName: "BuscayCurra",
  // Carga la web en remoto — siempre actualizada sin rebuild nativo
  server: {
    url: "https://buscaycurra.es",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0f1117",
    // Permisos nativos requeridos por App Store Review
    infoPlist: {
      NSCameraUsageDescription: "BuscayCurra necesita acceso a la cámara para añadir tu foto profesional al CV.",
      NSPhotoLibraryUsageDescription: "BuscayCurra necesita acceso a tus fotos para seleccionar tu foto de perfil para el CV.",
      NSPhotoLibraryAddUsageDescription: "BuscayCurra puede guardar capturas de tus candidaturas en tu carrete.",
      NSMicrophoneUsageDescription: "BuscayCurra necesita el micrófono para el simulador de entrevistas con respuesta por voz.",
      NSUserNotificationsUsageDescription: "Activa las notificaciones para recibir alertas cuando Guzzi encuentre nuevas ofertas o una empresa responda a tu candidatura.",
      NSLocationWhenInUseUsageDescription: "BuscayCurra puede usar tu ubicación para filtrar ofertas cercanas a ti.",
    },
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0f1117",
      showSpinner: false,
    },
  },
};

export default config;
