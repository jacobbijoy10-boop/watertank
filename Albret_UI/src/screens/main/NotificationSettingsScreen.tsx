import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/config/supabase';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function NotificationSettingsScreen() {
    const user = useAuthStore(state => state.user);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [dndEnabled, setDndEnabled] = useState(false);

    const handleSaveSettings = async () => {
        if (!user) {
            Alert.alert('Error', 'User not logged in');
            return;
        }

        const settings = {
            push_enabled: pushEnabled,
            sound_enabled: soundEnabled,
            vibration_enabled: vibrationEnabled,
            dnd_enabled: dndEnabled,
        };

        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    user_id: user.id,
                    setting_type: 'notifications',
                    setting_key: 'notification_settings',
                    setting_value: settings,
                });

            if (error) throw error;
            Alert.alert('Success', 'Notification settings saved');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save settings');
        }
    };

    const handleTestNotification = () => {
        Alert.alert(
            'Test Notification',
            'This is how notifications will appear on your device.',
            [{ text: 'OK' }]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Notification Settings</Text>
                <Text style={styles.subtitle}>Configure how you receive notifications</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Push Notifications</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Enable Push Notifications</Text>
                            <Text style={styles.settingSubtext}>
                                Receive real-time alerts on your device
                            </Text>
                        </View>
                        <Switch
                            value={pushEnabled}
                            onValueChange={setPushEnabled}
                            trackColor={{ false: colors.gray300, true: colors.primary }}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Sound</Text>
                            <Text style={styles.settingSubtext}>
                                Play sound for notifications
                            </Text>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={setSoundEnabled}
                            trackColor={{ false: colors.gray300, true: colors.primary }}
                            disabled={!pushEnabled}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Vibration</Text>
                            <Text style={styles.settingSubtext}>
                                Vibrate for notifications
                            </Text>
                        </View>
                        <Switch
                            value={vibrationEnabled}
                            onValueChange={setVibrationEnabled}
                            trackColor={{ false: colors.gray300, true: colors.primary }}
                            disabled={!pushEnabled}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Do Not Disturb</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Enable DND Mode</Text>
                            <Text style={styles.settingSubtext}>
                                Silence non-critical notifications
                            </Text>
                        </View>
                        <Switch
                            value={dndEnabled}
                            onValueChange={setDndEnabled}
                            trackColor={{ false: colors.gray300, true: colors.primary }}
                        />
                    </View>

                    {dndEnabled && (
                        <View style={styles.infoCard}>
                            <Text style={styles.infoText}>
                                ℹ️ Critical alerts will still be delivered even in DND mode
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.button, styles.testButton]}
                    onPress={handleTestNotification}
                >
                    <Text style={styles.testButtonText}>Send Test Notification</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSaveSettings}
                >
                    <Text style={styles.saveButtonText}>Save Settings</Text>
                </TouchableOpacity>
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
    content: {
        padding: spacing.md,
    },
    section: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    settingInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    settingLabel: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    settingSubtext: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    infoCard: {
        backgroundColor: colors.info + '20',
        borderRadius: 8,
        padding: spacing.md,
        marginTop: spacing.md,
    },
    infoText: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    button: {
        borderRadius: 8,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    testButton: {
        backgroundColor: colors.secondary,
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    testButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
});
