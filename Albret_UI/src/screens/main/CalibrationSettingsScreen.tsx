import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { useDeviceStore } from '@/store/deviceStore';
import { supabase } from '@/config/supabase';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function CalibrationSettingsScreen() {
    const selectedDevice = useDeviceStore(state => state.selectedDevice);
    const [phOffset, setPhOffset] = useState('0.0');
    const [tdsMultiplier, setTdsMultiplier] = useState('1.0');
    const [turbidityOffset, setTurbidityOffset] = useState('0.0');

    const handleSaveCalibration = async () => {
        if (!selectedDevice) {
            Alert.alert('Error', 'No device selected');
            return;
        }

        const calibrationData = {
            ph_offset: parseFloat(phOffset),
            tds_multiplier: parseFloat(tdsMultiplier),
            turbidity_offset: parseFloat(turbidityOffset),
        };

        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    device_id: selectedDevice.id,
                    user_id: selectedDevice.user_id,
                    setting_type: 'calibration',
                    setting_key: 'sensor_calibration',
                    setting_value: calibrationData,
                });

            if (error) throw error;
            Alert.alert('Success', 'Calibration settings saved');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save calibration');
        }
    };

    if (!selectedDevice) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No device selected</Text>
                <Text style={styles.emptySubtext}>Select a device from Device Management</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Sensor Calibration</Text>
                <Text style={styles.subtitle}>Calibrate sensors for {selectedDevice.device_name}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>📋 Calibration Instructions</Text>
                    <Text style={styles.infoText}>
                        1. Prepare calibration solutions{'\n'}
                        2. Immerse sensors in solutions{'\n'}
                        3. Wait for stable readings{'\n'}
                        4. Adjust offsets below{'\n'}
                        5. Save calibration data
                    </Text>
                </View>

                <View style={styles.calibrationSection}>
                    <Text style={styles.sensorLabel}>pH Sensor</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Offset</Text>
                        <TextInput
                            style={styles.input}
                            value={phOffset}
                            onChangeText={setPhOffset}
                            keyboardType="decimal-pad"
                            placeholder="0.0"
                        />
                    </View>
                </View>

                <View style={styles.calibrationSection}>
                    <Text style={styles.sensorLabel}>TDS Sensor</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Multiplier</Text>
                        <TextInput
                            style={styles.input}
                            value={tdsMultiplier}
                            onChangeText={setTdsMultiplier}
                            keyboardType="decimal-pad"
                            placeholder="1.0"
                        />
                    </View>
                </View>

                <View style={styles.calibrationSection}>
                    <Text style={styles.sensorLabel}>Turbidity Sensor</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Offset</Text>
                        <TextInput
                            style={styles.input}
                            value={turbidityOffset}
                            onChangeText={setTurbidityOffset}
                            keyboardType="decimal-pad"
                            placeholder="0.0"
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveCalibration}>
                    <Text style={styles.saveButtonText}>Save Calibration</Text>
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
    infoCard: {
        backgroundColor: colors.info + '20',
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: colors.info,
    },
    infoTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: colors.info,
        marginBottom: spacing.sm,
    },
    infoText: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
    },
    calibrationSection: {
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
    sensorLabel: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    inputGroup: {
        marginBottom: spacing.sm,
    },
    inputLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: 8,
        padding: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    emptyText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    emptySubtext: {
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
