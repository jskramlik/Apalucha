import { Alert, Platform } from 'react-native';

// react-native-web's Alert.alert is a no-op, so confirmations and error
// messages silently do nothing when running in a browser. These helpers
// fall back to window.alert/window.confirm on web and use the real
// native Alert everywhere else.

export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel'
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
