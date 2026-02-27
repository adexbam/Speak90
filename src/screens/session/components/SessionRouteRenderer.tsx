import React from 'react';
import { blurActiveElement } from '../../../utils/blurActiveElement';
import { SessionCompleteView } from './SessionCompleteView';
import { SessionMainFlow } from './SessionMainFlow';
import { SessionModeGate } from './SessionModeGate';
import { SessionTransitionView } from './SessionTransitionView';
import { buildSessionMainFlow, buildSessionModeGateProps, getSessionElapsedLabel } from '../useSessionScreenModels';
import type { useSessionViewModel } from '../useSessionViewModel';

type SessionViewModel = ReturnType<typeof useSessionViewModel>;

type SessionRouteRendererProps = {
  vm: SessionViewModel;
};

export function SessionRouteRenderer({ vm }: SessionRouteRendererProps) {
  const gate = SessionModeGate(buildSessionModeGateProps(vm));
  if (gate) {
    return gate;
  }

  if (vm.engine.sectionTransition) {
    return (
      <SessionTransitionView
        completedTitle={vm.engine.sectionTransition.completedTitle}
        nextTitle={vm.engine.sectionTransition.nextTitle}
        nextType={vm.engine.sectionTransition.nextType}
        onContinue={vm.engine.continueFromTransition}
      />
    );
  }

  if (vm.engine.isComplete) {
    return (
      <SessionCompleteView
        dayNumber={vm.route.day?.dayNumber ?? 1}
        elapsedLabel={getSessionElapsedLabel(vm)}
        progressSaved={vm.persistence.progressSaved}
        isPracticeMode={vm.route.isPracticeMode}
        onViewStats={async () => {
          blurActiveElement();
          await vm.persistence.persistCompletionNow();
          vm.router.push('/stats');
        }}
        onBackHome={async () => {
          blurActiveElement();
          await vm.persistence.persistCompletionNow();
          await vm.showInterstitialIfReady();
          vm.router.replace('/');
        }}
      />
    );
  }

  const { model, handlers } = buildSessionMainFlow(vm);
  return <SessionMainFlow model={model} handlers={handlers} />;
}
