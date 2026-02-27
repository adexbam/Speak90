import React from 'react';
import { act, create } from 'react-test-renderer';
import type { SrsCard } from '../../../data/srs-store';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { MicroReviewRunner } from './MicroReviewRunner';

function makeCard(dayNumber: number, index: number): SrsCard {
  return {
    id: `d${dayNumber}:anki:${index}`,
    dayNumber,
    sectionId: 'anki-a',
    sentenceIndex: index,
    prompt: `Prompt ${dayNumber}-${index}`,
    answer: `Antwort ${dayNumber}-${index}`,
    box: 1,
    dueDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    reviewCount: 0,
    successCount: 0,
  };
}

function pressButton(renderer: ReturnType<typeof create>, label: string) {
  const button = renderer.root.findAllByType(PrimaryButton).find((item) => item.props.label === label);
  if (!button) {
    throw new Error(`Button "${label}" not found`);
  }
  act(() => {
    button.props.onPress();
  });
}

describe('MicroReviewRunner', () => {
  it('runs phase transitions from anki to memory to main session', () => {
    const onContinue = jest.fn();
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <MicroReviewRunner
          isLoading={false}
          cards={[makeCard(1, 0), makeCard(1, 1)]}
          memorySentences={['I start now -> Ich beginne jetzt.']}
          source="previous_day"
          onContinue={onContinue}
        />,
      );
    });

    pressButton(renderer!, 'Flip');
    pressButton(renderer!, 'Next Anki');
    pressButton(renderer!, 'Flip');
    pressButton(renderer!, 'Finish Session 1');
    pressButton(renderer!, 'Reveal');
    pressButton(renderer!, 'Finish Session 2');
    pressButton(renderer!, 'Start Main Session');

    expect(onContinue).toHaveBeenCalledTimes(1);

    act(() => {
      renderer!.unmount();
    });
  });
});
