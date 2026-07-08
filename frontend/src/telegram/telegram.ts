import {
  init,
  restoreInitData,
  initDataRaw,
  mountThemeParams,
  bindThemeParamsCssVars,
  mountMiniApp,
  miniAppReady,
  hapticFeedbackImpactOccurred,
  hapticFeedbackNotificationOccurred,
  isTMA,
  mountBackButton,
  isBackButtonMounted,
  showBackButton,
  hideBackButton,
  onBackButtonClick,
  offBackButtonClick,
} from "@telegram-apps/sdk";
import { useEffect, useRef } from "react";

/** Best-effort SDK bring-up. No-ops (rather than throwing) when running
 * outside Telegram, e.g. in a regular browser during local development. */
export function initTelegram() {
  try {
    init();
  } catch {
    /* not running inside Telegram */
  }
  try {
    restoreInitData();
  } catch {
    /* no launch params available */
  }
  try {
    mountThemeParams();
    bindThemeParamsCssVars();
  } catch {
    /* theme params unsupported */
  }
  try {
    mountMiniApp();
    miniAppReady();
  } catch {
    /* mini app shell unsupported */
  }
}

export function isRunningInTelegram(): Promise<boolean> {
  try {
    return isTMA();
  } catch {
    return Promise.resolve(false);
  }
}

export function getTelegramInitDataRaw(): string | null {
  try {
    return initDataRaw() ?? null;
  } catch {
    return null;
  }
}

export function hapticSuccess() {
  try {
    hapticFeedbackNotificationOccurred("success");
  } catch {
    /* ignore */
  }
}

export function hapticError() {
  try {
    hapticFeedbackNotificationOccurred("error");
  } catch {
    /* ignore */
  }
}

export function hapticTap() {
  try {
    hapticFeedbackImpactOccurred("light");
  } catch {
    /* ignore */
  }
}

/** Shows Telegram's native top-left back button for as long as the calling
 * screen is mounted, routing its clicks to `onBack`. No-ops outside Telegram
 * (e.g. a regular browser during local development). */
export function useTelegramBackButton(onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    const handleClick = () => onBackRef.current();
    try {
      if (!isBackButtonMounted()) mountBackButton();
      showBackButton();
      onBackButtonClick(handleClick);
    } catch {
      /* BackButton unsupported outside Telegram */
    }
    return () => {
      try {
        offBackButtonClick(handleClick);
        hideBackButton();
      } catch {
        /* ignore */
      }
    };
  }, []);
}
