import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function SettingsScreen({ navigation }: any) {

    const settingsSections = [
        {
            title: 'Device Settings',
            items: [
                { label: 'Sensor Thresholds', screen: 'ThresholdSettings' },
                { label: 'Calibration', screen: 'CalibrationSettings' },
                { label: 'Device Management', screen: 'DeviceManagement' },
            ],
        },
        {
            title: 'Notifications',
            items: [
                { label: 'Alert Preferences', screen: 'AlertPreferences' },
                { label: 'Push Notifications', screen: 'NotificationSettings' },
            ],
        },
        {
            title: 'Account',
            items: [
                { label: 'Profile Settings', onPress: () => navigation.navigate('Profile') },
                { label: 'Change Password', screen: 'ChangePassword' },
            ],
        },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Configure your preferences</Text>
            </View>

            {settingsSections.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {section.items.map((item, itemIndex) => (
                        <TouchableOpacity
                            key={itemIndex}
                            style={styles.settingItem}
                            onPress={item.onPress || (() => item.screen && navigation.navigate(item.screen))}
                        >
                            <Text style={styles.settingLabel}>{item.label}</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}

            <View style={styles.appInfo}>
                <Text style={styles.appInfoText}>Water Tank Monitor</Text>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.lg,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    title: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    section: {
        marginTop: spacing.md,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.gray200,
    },
    sectionTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.textSecondary,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        textTransform: 'uppercase',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    settingLabel: {
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
    },
    chevron: {
        fontSize: typography.fontSize['2xl'],
        color: colors.gray400,
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
    },
    appInfoText: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    appVersion: {
        fontSize: typography.fontSize.xs,
        color: colors.gray400,
        marginTop: spacing.xs,
    },
});
