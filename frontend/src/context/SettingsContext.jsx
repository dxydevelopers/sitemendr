import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

// Fetched once and shared app-wide, same pattern as AuthContext/CartContext.
// Defaults here match what was previously hardcoded across the site, so if
// the fetch hasn't resolved yet (or ever fails), nothing breaks or flashes
// empty — it just behaves exactly as it did before this existed.
const DEFAULT_SETTINGS = {
  whatsappNumber: "254140122685",
  contactEmail: "hello@azardstores.co.ke",
  deliveryFee: 0,
  freeDeliveryThreshold: 0,
  maintenanceMode: false,
  paymentMethods: { mpesa: false, paystack: false },
};

const SettingsContext = createContext({ settings: DEFAULT_SETTINGS, loading: true });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings")
      .then((res) => setSettings((prev) => ({ ...prev, ...res.data })))
      .catch(() => {}) // keep defaults on failure — never block rendering on this
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
