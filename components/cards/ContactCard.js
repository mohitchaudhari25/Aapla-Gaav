import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../constants';
import AppText from '../ui/AppText';

export default function ContactCard({ name, role, phone, type, style }) {
  const isEmergency = type === 'emergency';
  
  const handleCall = () => {
    if (!phone) return;
    
    const phoneNumber = Platform.OS === 'android' ? `tel:${phone}` : `telprompt:${phone}`;
    Linking.canOpenURL(phoneNumber)
      .then(supported => {
        if (!supported) {
          Alert.alert('Unable to call', 'Calling is not supported on this device.');
        } else {
          return Linking.openURL(phoneNumber);
        }
      })
      .catch(err => console.log('Error opening phone dialer', err));
  };

  return (
    <View style={[styles.card, isEmergency && styles.emergencyCard, style]}>
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <View style={[styles.iconWrapper, isEmergency ? styles.emergencyIconWrapper : styles.villageIconWrapper]}>
            <Ionicons 
              name={isEmergency ? 'alert-circle' : 'person'} 
              size={24} 
              color={isEmergency ? colors.error : colors.primary} 
            />
          </View>
          <View style={styles.textContainer}>
            <AppText variant="headingSmall" style={styles.name}>{name}</AppText>
            {role ? (
              <AppText variant="label" style={styles.role}>{role}</AppText>
            ) : null}
          </View>
        </View>

        <View style={styles.phoneRow}>
          <Ionicons name="call-outline" size={16} color={colors.secondaryText} style={styles.phoneIcon} />
          <AppText variant="bodyMedium" style={styles.phoneText}>
            {phone ? phone : 'माहिती उपलब्ध नाही'}
          </AppText>
        </View>
      </View>

      {!!phone && (
        <TouchableOpacity 
          style={[styles.callButton, isEmergency && styles.emergencyCallButton]} 
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={20} color={isEmergency ? colors.white : colors.primary} />
          <AppText variant="label" style={[styles.callButtonText, isEmergency && styles.emergencyCallButtonText]}>
            कॉल करा
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  emergencyCard: {
    borderColor: colors.error + '40',
    backgroundColor: colors.error + '05',
  },
  infoContainer: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  villageIconWrapper: {
    backgroundColor: colors.primaryPale,
  },
  emergencyIconWrapper: {
    backgroundColor: colors.error + '20',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    color: colors.text,
    marginBottom: 2,
  },
  role: {
    color: colors.secondaryText,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  phoneIcon: {
    marginRight: spacing.xs,
  },
  phoneText: {
    color: colors.text,
    fontWeight: '500',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryPale,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emergencyCallButton: {
    backgroundColor: colors.error,
    borderTopColor: colors.error,
  },
  callButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  emergencyCallButtonText: {
    color: colors.white,
  }
});
