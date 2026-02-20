import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { sessionStyles } from '../session.styles';

type CloudConsentModalProps = {
  visible: boolean;
  onApprove: () => void;
  onDeny: () => void;
  onDismiss: () => void;
};

export function CloudConsentModal({ visible, onApprove, onDeny, onDismiss }: CloudConsentModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={sessionStyles.modalBackdrop}>
        <View style={sessionStyles.modalCard}>
          <AppText variant="cardTitle" center>
            Cloud Audio Consent
          </AppText>
          <AppText variant="caption" muted>
            We can upload your recording to process cloud pronunciation scoring.
          </AppText>
          <AppText variant="caption" muted>
            Retention: cloud audio is retained only for processing and troubleshooting.
          </AppText>
          <AppText variant="caption" muted>
            Opt-out: choose Deny now, or later disable cloud features in settings.
          </AppText>
          <PrimaryButton label="I Consent" onPress={onApprove} />
          <PrimaryButton label="Deny (Local-only)" onPress={onDeny} />
          <Pressable onPress={onDismiss}>
            <AppText variant="caption" center style={sessionStyles.linkLikeText}>
              Cancel
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

