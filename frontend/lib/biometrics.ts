/**
 * Behavioral biometrics capture utilities.
 *
 * Attaches event listeners to a target element and collects:
 *   - Keystroke events (keydown / keyup timestamps)
 *   - Mouse movement samples (throttled to 50ms)
 *   - Form fill duration
 *
 * Usage:
 *   const capture = createBiometricCapture(formElement);
 *   capture.start();
 *   const payload = capture.stop();
 */

import type { BehaviorPayload, KeystrokeEvent, MouseEventData } from '@/types';

export interface BiometricCapture {
  start: () => void;
  stop: () => BehaviorPayload;
}

export function createBiometricCapture(target: HTMLElement | Document = document): BiometricCapture {
  const keystrokes: KeystrokeEvent[] = [];
  const mouseMovements: MouseEventData[] = [];
  let startTime: number | null = null;
  let lastMouseCapture = 0;

  const handleKeyDown = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (!startTime) startTime = performance.now();
    if (ke.key) {
      keystrokes.push({ key: ke.key, timestamp: performance.now(), event_type: 'keydown' });
    }
  };

  const handleKeyUp = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key) {
      keystrokes.push({ key: ke.key, timestamp: performance.now(), event_type: 'keyup' });
    }
  };

  const handleMouseMove = (e: Event) => {
    const now = performance.now();
    if (now - lastMouseCapture < 50) return; // Throttle to 20 samples/sec
    lastMouseCapture = now;
    const me = e as MouseEvent;
    mouseMovements.push({ x: me.clientX, y: me.clientY, timestamp: now });
  };

  return {
    start() {
      startTime = null;
      keystrokes.length = 0;
      mouseMovements.length = 0;
      target.addEventListener('keydown', handleKeyDown);
      target.addEventListener('keyup', handleKeyUp);
      target.addEventListener('mousemove', handleMouseMove);
    },
    stop(): BehaviorPayload {
      const endTime = performance.now();
      target.removeEventListener('keydown', handleKeyDown);
      target.removeEventListener('keyup', handleKeyUp);
      target.removeEventListener('mousemove', handleMouseMove);

      return {
        keystrokes: keystrokes.filter((event) => event.key && event.timestamp && event.event_type),
        mouse_movements: [...mouseMovements],
        form_fill_duration_ms: startTime ? endTime - startTime : null,
      };
    },
  };
}
