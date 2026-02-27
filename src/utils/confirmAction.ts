import { Alert, Platform } from 'react-native';

type ConfirmActionParams = {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
};

export async function confirmAction({
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  destructive = false,
}: ConfirmActionParams): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.confirm(message);
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      {
        text: cancelText,
        style: 'cancel',
        onPress: () => resolve(false),
      },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}

