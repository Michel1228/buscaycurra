// @ts-nocheck
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
    // @ts-expect-error — infoPlist es válido en runtime, falta en tipos de capacitor
    infoPlist: {
      // Foto de perfil y fotos en perfil Au Pair
      NSCameraUsageDescription: "BuscayCurra necesita acceso a la cámara para añadir tu foto profesional al CV y al perfil Au Pair.",
      NSPhotoLibraryUsageDescription: "BuscayCurra necesita acceso a tus fotos para seleccionar tu foto de perfil y fotos del perfil Au Pair.",
      NSPhotoLibraryAddUsageDescription: "BuscayCurra puede guardar capturas de tus candidaturas en tu carrete.",
      // Simulador de entrevistas con respuesta por voz
      NSMicrophoneUsageDescription: "BuscayCurra usa el micrófono para el simulador de entrevistas con IA, donde puedes responder las preguntas por voz.",
      // Alertas de nuevas ofertas y respuestas de empresas
      NSUserNotificationsUsageDescription: "Activa las notificaciones para recibir alertas cuando Guzzi encuentre nuevas ofertas o una empresa responda a tu candidatura.",
      // NSLocationWhenInUseUsageDescription eliminado — no se usa en la versión actual
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
