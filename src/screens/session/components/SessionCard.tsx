import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { SentenceSpeakerButton } from '../../../ui/SentenceSpeakerButton';
import { colors } from '../../../ui/tokens';
import { sessionStyles } from '../session.styles';

type SessionCardProps = {
  sentence: string;
  speechText: string;
  isPatternSection: boolean;
  isAnkiSection: boolean;
  isFreeSection: boolean;
  patternRevealed: boolean;
  ankiFlipped: boolean;
  patternPrompt: string;
  patternTarget: string;
  ankiFront: string;
  ankiBack: string;
  freePrompt: string;
  freeCues: string[];
  sentenceShownLabel: string;
};

export function SessionCard({
  sentence,
  speechText,
  isPatternSection,
  isAnkiSection,
  isFreeSection,
  patternRevealed,
  ankiFlipped,
  patternPrompt,
  patternTarget,
  ankiFront,
  ankiBack,
  freePrompt,
  freeCues,
  sentenceShownLabel,
}: SessionCardProps) {
  return (
    <View style={sessionStyles.sentenceCard}>
      <SentenceSpeakerButton text={speechText} style={sessionStyles.speakerButton} />
      {isPatternSection && patternRevealed ? (
        <>
          <AppText variant="caption" muted center style={sessionStyles.sentence}>
            {patternPrompt}
          </AppText>
          <AppText
            variant="cardTitle"
            center
            style={[sessionStyles.sentence, { color: colors.accentSuccess, fontWeight: '700', marginTop: 8 }]}
          >
            {patternTarget}
          </AppText>
        </>
      ) : (
        <>
          {isAnkiSection && ankiFlipped ? (
            <>
              <AppText variant="caption" muted center style={sessionStyles.sentence}>
                {ankiFront}
              </AppText>
              <AppText
                variant="cardTitle"
                center
                style={[sessionStyles.sentence, { color: colors.accentSuccess, fontWeight: '700', marginTop: 8 }]}
              >
                {ankiBack}
              </AppText>
            </>
          ) : (
            <AppText variant="cardTitle" style={sessionStyles.sentence}>
              {isFreeSection ? freePrompt : isPatternSection ? patternPrompt : isAnkiSection ? ankiFront : sentence}
            </AppText>
          )}
        </>
      )}
      {isPatternSection && !patternRevealed ? (
        <AppText variant="caption" muted center style={sessionStyles.helperText}>
          Speak your German translation aloud, then tap Reveal.
        </AppText>
      ) : null}
      {isAnkiSection && !ankiFlipped ? (
        <AppText variant="caption" muted center style={sessionStyles.helperText}>
          Read the front, say the German out loud, then tap Flip.
        </AppText>
      ) : null}
      {isFreeSection && freeCues.length > 0 ? (
        <View style={sessionStyles.cueWrap}>
          <AppText variant="caption" muted center>
            Cue words:
          </AppText>
          {freeCues.map((cue) => (
            <AppText key={cue} variant="bodySecondary" center>
              {cue}
            </AppText>
          ))}
        </View>
      ) : null}
      <AppText variant="caption" muted center style={{ marginTop: 8 }}>
        Text shown: {sentenceShownLabel}
      </AppText>
    </View>
  );
}
