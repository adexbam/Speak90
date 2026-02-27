import { buildSessionMainFlowHandlers } from './useSessionMainFlowHandlers';
import { buildSessionMainFlowModel } from './useSessionMainFlowModel';
import { getSessionElapsedLabel } from './useSessionElapsedLabel';
import { buildSessionModeGateProps } from './useSessionGateModel';
import type { SessionViewModel } from './useSessionScreenModel.shared';

export { getSessionElapsedLabel, buildSessionModeGateProps };

export function buildSessionMainFlow(vm: SessionViewModel) {
  return {
    model: buildSessionMainFlowModel(vm),
    handlers: buildSessionMainFlowHandlers(vm),
  };
}
