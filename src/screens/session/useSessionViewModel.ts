import { useSessionRuntimeModel } from './useSessionRuntimeModel';
import { useSessionModeModel } from './useSessionModeModel';
import { useSessionAudioModel } from './useSessionAudioModel';
import { useSessionActionHandlers } from './useSessionActionHandlers';
import { buildSessionActionDeps } from './useSessionViewModel.coordinator';

export function useSessionViewModel() {
  // Stage 1: runtime state and derived content
  const runtime = useSessionRuntimeModel();
  // Stage 2: audio state (depends on runtime speech target and flags)
  const audio = useSessionAudioModel(runtime);
  // Stage 3: mode controllers
  const mode = useSessionModeModel(runtime);
  // Stage 4: action handlers (explicit contract of cross-stage dependencies)
  const actions = useSessionActionHandlers(buildSessionActionDeps(runtime, audio, mode));

  return {
    ...runtime,
    modeControllers: mode.modeControllers,
    newDayController: mode.newDayController,
    ...audio,
    actions,
  };
}
