import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useDeviceStore } from '@/store/deviceStore';
import { supabase } from '@/config/supabase';
import { DEFAULT_THRESHOLDS, SENSOR_LABELS } from '@/config/constants';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface ThresholdSettings {
    ph_min: number;
    ph_max: number;
    tds_min: number;
    tds_max: number;
    turbidity_max: number;
    temperature_max: number;
    water_level_min: number;
}

export default function ThresholdSettingsScreen() {
    const selectedDevice = useDeviceStore(state => state.selectedDevice);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Threshold states
    const [phMin, setPhMin] = useState(DEFAULT_THRESHOLDS.PH_MIN.toString());
    const [phMax, setPhMax] = useState(DEFAULT_THRESHOLDS.PH_MAX.toString());
    const [tdsMin, setTdsMin] = useState(DEFAULT_THRESHOLDS.TDS_MIN.toString());
    const [tdsMax, setTdsMax] = useState(DEFAULT_THRESHOLDS.TDS_MAX.toString());
    const [turbidityMax, setTurbidityMax] = useState(DEFAULT_THRESHOLDS.TURBIDITY_MAX.toString());
    const [temperatureMax, setTemperatureMax] = useState(DEFAULT_THRESHOLDS.TEMPERATURE_MAX.toString());
    const [waterLevelMin, setWaterLevelMin] = useState('20');

    useEffect(() => {
        fetchThresholds();
    }, [selectedDevice?.id]);

    const fetchThresholds = async () => {
        if (!selectedDevice) {
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('settings')
                .select('setting_value')
                .eq('device_id', selectedDevice.id)
                .eq('setting_type', 'thresholds')
                .single();

            if (error && error.code !== 'PGRST116') { // Ignore not found error
                throw error;
            }

            if (data?.setting_value) {
                const thresholds = data.setting_value as ThresholdSettings;
                setPhMin(thresholds.ph_min.toString());
                setPhMax(thresholds.ph_max.toString());
                setTdsMin(thresholds.tds_min.toString());
                setTdsMax(thresholds.tds_max.toString());
                setTurbidityMax(thresholds.turbidity_max.toString());
                setTemperatureMax(thresholds.temperature_max.toString());
                setWaterLevelMin(thresholds.water_level_min.toString());
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to load thresholds');
        } finally {
            setIsLoading(false);
        }
    };

    const validateThresholds = (): boolean => {
        const phMinNum = parseFloat(phMin);
        const phMaxNum = parseFloat(phMax);
        const tdsMinNum = parseFloat(tdsMin);
        const tdsMaxNum = parseFloat(tdsMax);
        const turbidityMaxNum = parseFloat(turbidityMax);
        const temperatureMaxNum = parseFloat(temperatureMax);
        const waterLevelMinNum = parseFloat(waterLevelMin);

        // Check for valid numbers
        if (isNaN(phMinNum) || isNaN(phMaxNum) || isNaN(tdsMinNum) ||
            isNaN(tdsMaxNum) || isNaN(turbidityMaxNum) ||
            isNaN(temperatureMaxNum) || isNaN(waterLevelMinNum)) {
            Alert.alert('Validation Error', 'All threshold values must be valid numbers');
            return false;
        }

        // Check min < max
        if (phMinNum >= phMaxNum) {
            Alert.alert('Validation Error', 'pH minimum must be less than maximum');
            return false;
        }

        if (tdsMinNum >= tdsMaxNum) {
            Alert.alert('Validation Error', 'TDS minimum must be less than maximum');
            return false;
        }

        // Check reasonable ranges
        if (phMinNum < 0 || phMaxNum > 14) {
            Alert.alert('Validation Error', 'pH values must be between 0 and 14');
            return false;
        }

        if (turbidityMaxNum < 0) {
            Alert.alert('Validation Error', 'Turbidity maximum cannot be negative');
            return false;
        }

        if (waterLevelMinNum < 0 || waterLevelMinNum > 100) {
            Alert.alert('Validation Error', 'Water level minimum must be between 0 and 100');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!selectedDevice) {
            Alert.alert('Error', 'No device selected');
            return;
        }

        if (!validateThresholds()) {
            return;
        }

        setIsSaving(true);

        const thresholds: ThresholdSettings = {
            ph_min: parseFloat(phMin),
            ph_max: parseFloat(phMax),
            tds_min: parseFloat(tdsMin),
            tds_max: parseFloat(tdsMax),
            turbidity_max: parseFloat(turbidityMax),
            temperature_max: parseFloat(temperatureMax),
            water_level_min: parseFloat(waterLevelMin),
        };

        try {
            // Upsert settings
            const { error } = await supabase
                .from('settings')
                .upsert({
                    device_id: selectedDevice.id,
                    user_id: selectedDevice.user_id,
                    setting_type: 'thresholds',
                    setting_key: 'sensor_thresholds',
                    setting_value: thresholds,
                });

            if (error) throw error;

            Alert.alert('Success', 'Threshold settings saved successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save thresholds');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetToDefaults = () => {
        Alert.alert(
            'Reset to Defaults',
            'Are you sure you want to reset all thresholds to default values?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                        setPhMin(DEFAULT_THRESHOLDS.PH_MIN.toString());
                        setPhMax(DEFAULT_THRESHOLDS.PH_MAX.toString());
                        setTdsMin(DEFAULT_THRESHOLDS.TDS_MIN.toString());
                        setTdsMax(DEFAULT_THRESHOLDS.TDS_MAX.toString());
                        setTurbidityMax(DEFAULT_THRESHOLDS.TURBIDITY_MAX.toString());
                        setTemperatureMax(DEFAULT_THRESHOLDS.TEMPERATURE_MAX.toString());
                        setWaterLevelMin('20');
                    }
                }
            ]
        );
    };

    if (!selectedDevice) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No device selected</Text>
                <Text style={styles.emptySubtext}>Please select a device from Device Management</Text>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading thresholds...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Sensor Thresholds</Text>
                <Text style={styles.subtitle}>Configure alert thresholds for {selectedDevice.device_name}</Text>
            </View>

            <View style={styles.content}>
                {/* pH Thresholds */}
                <View style={styles.sensorSection}>
                    <Text style={styles.sensorLabel}>{SENSOR_LABELS.PH}</Text>
                    <View style={styles.thresholdRow}>
                        <View style={styles.thresholdInput}>
                            <Text style={styles.inputLabel}>Minimum</Text>
                            <TextInput
                                style={styles.input}
                                value={phMin}
                                onChangeText={setPhMin}
                                keyboardType="decimal-pad"
                                placeholder="6.5"
                            />
                        </View>
                        <View style={styles.thresholdInput}>
                            <Text style={styles.inputLabel}>Maximum</Text>
                            <TextInput
                                style={styles.input}
                                value={phMax}
                                onChangeText={setPhMax}
                                keyboardType="decimal-pad"
                                placeholder="8.5"
                            />
                        </View>
                    </View>
                </View>

                {/* TDS Thresholds */}
                <View style={styles.sensorSection}>
                    <Text style={styles.sensorLabel}>{SENSOR_LABELS.TDS}</Text>
                    <View style={styles.thresholdRow}>
                        <View style={styles.thresholdInput}>
                            <Text style={styles.inputLabel}>Minimum (ppm)</Text>
                            <TextInput
                                style={styles.input}
                                value={tdsMin}
                                onChangeText={setTdsMin}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                        <View style={styles.thresholdInput}>
                            <Text style={styles.inputLabel}>Maximum (ppm)</Text>
                            <TextInput
                                style={styles.input}
                                value={tdsMax}
                                onChangeText={setTdsMax}
                                keyboardType="numeric"
                                placeholder="500"
                            />
                        </View>
                    </View>
                </View>

                {/* Turbidity Maximum */}
                <View style={styles.sensorSection}>
                    <Text style={styles.sensorLabel}>{SENSOR_LABELS.TURBIDITY}</Text>
                    <View style={styles.singleThreshold}>
                        <Text style={styles.inputLabel}>Maximum (NTU)</Text>
                        <TextInput
                            style={styles.input}
                            value={turbidityMax}
                            onChangeText={setTurbidityMax}
                            keyboardType="decimal-pad"
                            placeholder="5.0"
                        />
                    </View>
                </View>

                {/* Temperature Maximum */}
                <View style={styles.sensorSection}>
                    <Text style={styles.sensorLabel}>{SENSOR_LABELS.TEMPERATURE}</Text>
                    <View style={styles.singleThreshold}>
                        <Text style={styles.inputLabel}>Maximum (°C)</Text>
                        <TextInput
                            style={styles.input}
                            value={temperatureMax}
                            onChangeText={setTemperatureMax}
                            keyboardType="decimal-pad"
                            placeholder="35.0"
                        />
                    </View>
                </View>

                {/* Water Level Minimum */}
                <View style={styles.sensorSection}>
                    <Text style={styles.sensorLabel}>Water Level</Text>
                    <View style={styles.singleThreshold}>
                        <Text style={styles.inputLabel}>Minimum (%)</Text>
                        <TextInput
                            style={styles.input}
                            value={waterLevelMin}
                            onChangeText={setWaterLevelMin}
                            keyboardType="numeric"
                            placeholder="20"
                        />
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>ℹ️ About Thresholds</Text>
                    <Text style={styles.infoText}>
                        Alerts will be triggered when sensor readings fall outside these threshold ranges.
                        Set appropriate values based on your water quality requirements.
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.resetButton]}
                        onPress={handleResetToDefaults}
                    >
                        <Text style={styles.resetButtonText}>Reset to Defaults</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Thresholds</Text>
                        )}
                    </TouchableOpacity>
                </View>
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
    sensorSection: {
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
    thresholdRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    thresholdInput: {
        flex: 1,
    },
    singleThreshold: {
        width: '50%',
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
    infoCard: {
        backgroundColor: colors.info + '20',
        borderRadius: 12,
        padding: spacing.md,
        marginVertical: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.info,
    },
    infoTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: colors.info,
        marginBottom: spacing.xs,
    },
    infoText: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
    },
    actions: {
        gap: spacing.md,
        marginTop: spacing.md,
    },
    button: {
        padding: spacing.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    resetButton: {
        backgroundColor: colors.gray300,
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    resetButtonText: {
        color: colors.textPrimary,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
    },
});
