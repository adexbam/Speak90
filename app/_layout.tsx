import { useEffect } from "react";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import { enableScreens } from "react-native-screens";
import { Ionicons } from "@expo/vector-icons";
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
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => <Ionicons name="home" size={22} />,
        }}
      />
      <Stack.Screen
        name="session"
        options={{
          headerTitle: () => <Ionicons name="play-circle" size={24} />,
        }}
      />
      <Stack.Screen name="stats" options={{ title: "Stats" }} />
    </Stack>
  );
}
