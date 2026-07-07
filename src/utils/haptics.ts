import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const haptic = {
  light: () => Haptics.impact({ style: ImpactStyle.Light }),
  medium: () => Haptics.impact({ style: ImpactStyle.Medium }),
  heavy: () => Haptics.impact({ style: ImpactStyle.Heavy }),
  success: () => Haptics.notification({ type: NotificationType.Success }),
  warning: () => Haptics.notification({ type: NotificationType.Warning }),
  error: () => Haptics.notification({ type: NotificationType.Error }),
  selection: () => Haptics.selectionChanged(),
};
