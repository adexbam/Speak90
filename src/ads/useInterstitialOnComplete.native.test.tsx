import React from 'react';
import { act, create } from 'react-test-renderer';
import { useInterstitialOnComplete } from './useInterstitialOnComplete.native';

type Listener = (...args: unknown[]) => void;

const mockAd = (() => {
  const listeners: Record<string, Listener[]> = {};

  return {
    addAdEventListener: jest.fn((event: string, cb: Listener) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
      return () => {
        listeners[event] = (listeners[event] ?? []).filter((x) => x !== cb);
      };
    }),
    load: jest.fn(),
    show: jest.fn(),
    emit(event: string, payload?: unknown) {
      (listeners[event] ?? []).forEach((cb) => cb(payload));
    },
    reset() {
      Object.keys(listeners).forEach((key) => {
        listeners[key] = [];
      });
      this.addAdEventListener.mockClear();
      this.load.mockClear();
      this.show.mockClear();
    },
  };
})();

jest.mock('react-native-google-mobile-ads', () => {
  const AdEventType = {
    LOADED: 'loaded',
    CLOSED: 'closed',
    ERROR: 'error',
  };

  return {
    AdEventType,
    TestIds: {
      INTERSTITIAL: 'test-interstitial',
    },
    InterstitialAd: {
      createForAdRequest: jest.fn(() => mockAd),
    },
  };
});

let triggerInterstitial: (() => Promise<boolean>) | null = null;

function Harness() {
  triggerInterstitial = useInterstitialOnComplete();
  return null;
}

function getTrigger() {
  if (!triggerInterstitial) {
    throw new Error('Hook not initialized');
  }
  return triggerInterstitial;
}

describe('useInterstitialOnComplete.native', () => {
  let renderer: ReturnType<typeof create> | null = null;
  jest.setTimeout(20000);

  beforeEach(() => {
    jest.useFakeTimers();
    mockAd.reset();
    triggerInterstitial = null;
    renderer = null;
  });

  afterEach(() => {
    if (renderer) {
      act(() => {
        renderer?.unmount();
      });
    }
    jest.useRealTimers();
  });

  it('returns false when ad is not loaded yet', async () => {
    await act(async () => {
      renderer = create(<Harness />);
    });
    await expect(getTrigger()()).resolves.toBe(false);
    expect(mockAd.show).not.toHaveBeenCalled();
  });

  it('resolves true when ad closes after show', async () => {
    await act(async () => {
      renderer = create(<Harness />);
    });

    await act(async () => {
      mockAd.emit('loaded');
    });

    const pending = getTrigger()();
    await act(async () => {
      mockAd.emit('closed');
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5001);
    });

    await expect(pending).resolves.toBe(true);
    expect(mockAd.show).toHaveBeenCalledTimes(1);
  });

  it('resolves false when ad errors after show', async () => {
    await act(async () => {
      renderer = create(<Harness />);
    });

    await act(async () => {
      mockAd.emit('loaded');
    });

    const pending = getTrigger()();
    await act(async () => {
      mockAd.emit('error', new Error('failed'));
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5001);
    });

    await expect(pending).resolves.toBe(false);
  });

  it('resolves true on 5s timeout fallback if no close/error event fires', async () => {
    await act(async () => {
      renderer = create(<Harness />);
    });

    await act(async () => {
      mockAd.emit('loaded');
    });

    const pending = getTrigger()();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5001);
    });

    await expect(pending).resolves.toBe(true);
  });
});
