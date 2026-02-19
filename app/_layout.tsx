import { Stack } from "expo-router";
import { Platform } from "react-native";
import { enableScreens } from "react-native-screens";

if (Platform.OS === "web") {
  enableScreens(false);
}

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "speak90" }} />
    </Stack>
  );
}
