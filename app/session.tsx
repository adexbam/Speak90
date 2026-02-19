import { Stack } from 'expo-router';
import { SessionScreen } from '@/src/screens/session/SessionScreen';

export default function SessionRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Session' }} />
      <SessionScreen />
    </>
  );
}
