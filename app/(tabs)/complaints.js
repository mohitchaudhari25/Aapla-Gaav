import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenContainer from '../../components/common/ScreenContainer';
import EmptyState from '../../components/common/EmptyState';
import ComplaintCard from '../../components/cards/ComplaintCard';
import AppButton from '../../components/ui/AppButton';
import AppText from '../../components/ui/AppText';
import { spacing } from '../../constants';
import { DEMO_COMPLAINTS } from '../../data/complaints';

export default function Complaints() {
  const router = useRouter();
  const [complaints] = useState(DEMO_COMPLAINTS);

  const renderItem = ({ item }) => (
    <ComplaintCard 
      title={item.title}
      id={item.id}
      category={item.category}
      status={item.status}
      date={item.date}
      onPress={() => router.push({ pathname: '/complaints/details', params: { id: item.id } })}
    />
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText variant="headingMedium" style={styles.pageTitle}>माझ्या तक्रारी</AppText>
        <AppButton 
          title="नवीन तक्रार नोंदवा" 
          onPress={() => router.push('/complaints/new')} 
        />
      </View>
      
      {complaints.length === 0 ? (
        <EmptyState 
          title="कोणतीही तक्रार नाही"
          description="तुम्ही अजून कोणतीही तक्रार नोंदवलेली नाही."
          buttonTitle="नवीन तक्रार नोंदवा"
          onButtonPress={() => router.push('/complaints/new')}
        />
      ) : (
        <FlatList 
          data={complaints}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pageTitle: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  }
});
