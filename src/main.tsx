if (window.kcContext !== undefined) {
  void import("./keycloak-theme/main");
} else if (import.meta.env.VITE_KC_DEV === "true") {
  void import("./keycloak-theme/main.dev");
} else {
  void import("./main-app");
}
