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

export default function AlertPreferencesScreen() {
    const user = useAuthStore(state => state.user);
    const [phAlerts, setPhAlerts] = useState(true);
    const [tdsAlerts, setTdsAlerts] = useState(true);
    const [turbidityAlerts, setTurbidityAlerts] = useState(true);
    const [temperatureAlerts, setTemperatureAlerts] = useState(true);
    const [waterLevelAlerts, setWaterLevelAlerts] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);

    const handleSavePreferences = async () => {
        if (!user) {
            Alert.alert('Error', 'User not logged in');
            return;
        }

        const preferences = {
            ph_alerts: phAlerts,
            tds_alerts: tdsAlerts,
            turbidity_alerts: turbidityAlerts,
            temperature_alerts: temperatureAlerts,
            water_level_alerts: waterLevelAlerts,
            email_notifications: emailNotifications,
        };

        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    user_id: user.id,
                    setting_type: 'alert_preferences',
                    setting_key: 'user_alert_preferences',
                    setting_value: preferences,
                });

            if (error) throw error;
            Alert.alert('Success', 'Alert preferences saved');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save preferences');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Alert Preferences</Text>
                <Text style={styles.subtitle}>Choose which alerts you want to receive</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sensor Alerts</Text>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceLabel}>pH Alerts</Text>
                            <Text style={styles.preferenceSubtext}>
                                Alert when pH is outside threshold
                            </Text>
                        </View>
                        <Switch
                            value={phAlerts}
                            onValueChange={setPhAlerts}
                            trackColor={{ false: colors.gray300, true: colors.primary }}
                        />
                    </View>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceLabel}>TDS Alerts</Text>
                            <Text style={styles.preferenceSubtext}>
                                Alert when TDS is outside threshold
                            </Text>
                        </View>
                        <Switch
                            value={tdsAlerts}
                            onValueChange={setTdsAlerts}
                            trackColor={{ false: colors.gray300, true: colors.primary }}
                        />
                    </View>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceLabel}>Turbidity Alerts</Text>
                            <Text style={styles.preferenceSubtext}>
                                Alert when turbidity exceeds threshold
                            </Text>
                        </View>
                        <Switch
                            value={turbidityAlerts}
                            onValueChange={setTurbidityAlerts}
                            trackColor={{ false: colors.gray300, true: colors.primary }}
                        />
                    </View>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceLabel}>Temperature Alerts</Text>
                            <Text style={styles.preferenceSubtext}>
                                Alert when temperature exceeds threshold
                            </Text>
                        </View>
                        <Switch
                            value={temperatureAlerts}
                            onValueChange={setTemperatureAlerts}
                            trackColor={{ false: colors.gray300, true: colors.primary }}
                        />
                    </View>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceLabel}>Water Level Alerts</Text>
                            <Text style={styles.preferenceSubtext}>
                                Alert when water level is low
                            </Text>
                        </View>
                        <Switch
                            value={waterLevelAlerts}
                            onValueChange={setWaterLevelAlerts}
                            trackColor={{ false: colors.gray300, true: colors.primary }}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notification Channels</Text>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceLabel}>Email Notifications</Text>
                            <Text style={styles.preferenceSubtext}>
                                Receive alerts via email
                            </Text>
                        </View>
                        <Switch
                            value={emailNotifications}
                            onValueChange={setEmailNotifications}
                            trackColor={{ false: colors.gray300, true: colors.primary }}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSavePreferences}>
                    <Text style={styles.saveButtonText}>Save Preferences</Text>
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
    preferenceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    preferenceInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    preferenceLabel: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    preferenceSubtext: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
});
