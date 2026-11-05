/**
 * Haptic feedback utility for Apple-inspired tactile sensations
 * Uses the Vibration API where supported (e.g. mobile Safari / Chrome on iOS & Android)
 * with graceful no-op fallbacks for unsupported desktop browsers.
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

class HapticEngine {
  private hasVibration: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.hasVibration = 'vibrate' in navigator && typeof navigator.vibrate === 'function';
    }
  }

  /**
   * Trigger haptic feedback matching Apple Taptic Engine patterns:
   * - 'selection' / 'light': Subtle click (10ms) for tab taps, toggles, swatch selections
   * - 'medium': Noticeable tap (25ms) for primary buttons, scan triggers, copy
   * - 'heavy': Solid thud (40ms) for deletions, batch actions
   * - 'success': Two-beat pulse (15ms, 40ms pause, 30ms) for completed downloads, generation, scan decodes
   * - 'warning': Rapid double pulse (30ms, 40ms, 30ms)
   * - 'error': Triple pulse (50ms, 40ms, 50ms, 40ms, 50ms)
   */
  public trigger(style: HapticStyle = 'light'): void {
    if (!this.hasVibration) return;

    try {
      switch (style) {
        case 'selection':
        case 'light':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(28);
          break;
        case 'heavy':
          navigator.vibrate(45);
          break;
        case 'success':
          navigator.vibrate([15, 45, 30]);
          break;
        case 'warning':
          navigator.vibrate([30, 40, 30]);
          break;
        case 'error':
          navigator.vibrate([40, 40, 40, 40, 60]);
          break;
        default:
          navigator.vibrate(15);
      }
    } catch {
      // Ignore vibration errors (e.g., if user interaction requirement was not met)
    }
  }
}

export const haptic = new HapticEngine();
