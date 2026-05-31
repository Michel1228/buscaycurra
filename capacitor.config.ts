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
