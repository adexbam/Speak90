import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { sessionStyles } from '../session.styles';

type MicroReviewCardProps = {
  title: string;
  items: string[];
  emptyMessage: string;
};

export function MicroReviewCard({ title, items, emptyMessage }: MicroReviewCardProps) {
  return (
    <View style={sessionStyles.reviewBlockCard}>
      <AppText variant="caption" center muted>
        {title}
      </AppText>
      {items.length === 0 ? (
        <AppText variant="caption" center muted>
          {emptyMessage}
        </AppText>
      ) : (
        items.map((item) => (
          <AppText key={item} variant="bodySecondary" center>
            {item}
          </AppText>
        ))
      )}
    </View>
  );
}
