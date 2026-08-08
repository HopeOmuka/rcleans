import { StatusBar } from "expo-status-bar";

import { useTheme } from "@/lib/theme";

const ThemedStatusBar = () => {
  const { theme } = useTheme();
  return <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />;
};

export default ThemedStatusBar;
