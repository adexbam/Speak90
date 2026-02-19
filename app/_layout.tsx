import { useEffect } from "react";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import { enableScreens } from "react-native-screens";
import { RECORDINGS_SWEEPER_INTERVAL_MS, runRecordingSweeper } from "@/src/data/recordings-sweeper";

if (Platform.OS === "web") {
  enableScreens(false);
}

export default function RootLayout() {
  useEffect(() => {
    void runRecordingSweeper();

    const intervalId = setInterval(() => {
      void runRecordingSweeper();
    }, RECORDINGS_SWEEPER_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="session" options={{ title: "Session" }} />
      <Stack.Screen name="stats" options={{ title: "Stats" }} />
    </Stack>
  );
}
