export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface ClinicPushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerClinicServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = registration;
    return registration;
  } catch (error) {
    console.warn('Service Worker registration skipped:', error);
    return null;
  }
}

export function getPushPermissionState(): PushPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as PushPermissionState;
}

export async function requestPushPermission(): Promise<PushPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      await registerClinicServiceWorker();
    }
    return result as PushPermissionState;
  } catch {
    return getPushPermissionState();
  }
}

export async function dispatchClinicPushNotification(
  payload: ClinicPushPayload,
  onInAppFallback?: (payload: ClinicPushPayload) => void
): Promise<{ deliveredViaBrowser: boolean }> {
  onInAppFallback?.(payload);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { deliveredViaBrowser: false };
  }

  if (Notification.permission !== 'granted') {
    return { deliveredViaBrowser: false };
  }

  try {
    const reg = swRegistration || (await navigator.serviceWorker?.getRegistration('/'));
    if (reg) {
      if (reg.active) {
        reg.active.postMessage({
          type: 'SHOW_VISIT_REMINDER',
          ...payload,
        });
        return { deliveredViaBrowser: true };
      }
      await reg.showNotification(payload.title, {
        body: payload.body,
        tag: payload.tag || 'emirmed-repro-visit',
      });
      return { deliveredViaBrowser: true };
    }

    new Notification(payload.title, {
      body: payload.body,
      tag: payload.tag || 'emirmed-repro-visit',
    });
    return { deliveredViaBrowser: true };
  } catch {
    try {
      new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag || 'emirmed-repro-visit',
      });
      return { deliveredViaBrowser: true };
    } catch {
      return { deliveredViaBrowser: false };
    }
  }
}
