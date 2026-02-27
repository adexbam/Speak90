import { formatSeconds } from './useSessionScreenModel.shared';
import type { SessionViewModel } from './useSessionScreenModel.shared';

export function getSessionElapsedLabel(vm: SessionViewModel): string {
  return formatSeconds(vm.timer.sessionElapsedSeconds);
}
