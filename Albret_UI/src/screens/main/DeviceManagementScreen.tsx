import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    RefreshControl,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useDeviceStore } from '@/store/deviceStore';
import { supabase } from '@/config/supabase';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface Device {
    id: string;
    user_id: string;
    device_name: string;
    device_location?: string;
    is_online: boolean;
    created_at: string;
}

export default function DeviceManagementScreen() {
    const user = useAuthStore(state => state.user);
    const { devices, fetchDevices, selectDevice, selectedDevice } = useDeviceStore();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    
    // Form states
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceLocation, setNewDeviceLocation] = useState('');
    const [editDeviceName, setEditDeviceName] = useState('');
    const [editDeviceLocation, setEditDeviceLocation] = useState('');

    useEffect(() => {
        if (user?.id) {
            fetchDevices(user.id);
        }
    }, [user?.id]);

    const handleRefresh = async () => {
        if (user?.id) {
            setIsRefreshing(true);
            await fetchDevices(user.id);
            setIsRefreshing(false);
        }
    };

    const generateDeviceId = () => {
        // Generate UUID v4
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const handleAddDevice = async () => {
        if (!newDeviceName.trim()) {
            Alert.alert('Error', 'Please enter a device name');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        const deviceId = generateDeviceId();

        try {
            const { error } = await supabase
                .from('devices')
                .insert([{
                    id: deviceId,
                    user_id: user.id,
                    device_name: newDeviceName.trim(),
                    device_location: newDeviceLocation.trim() || null,
                    is_online: false,
                }]);

            if (error) throw error;

            Alert.alert(
                'Device Added Successfully!',
                `Device ID: ${deviceId}\n\nCopy this ID to your ESP32 config.h file.`,
                [
                    {
                        text: 'Copy ID',
                        onPress: () => {
                            // In a real app, you'd use Clipboard API
                            Alert.alert('Device ID', deviceId);
                        }
                    },
                    { text: 'OK' }
                ]
            );

            setNewDeviceName('');
            setNewDeviceLocation('');
            setIsAddModalVisible(false);
            await fetchDevices(user.id);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add device');
        }
    };

    const handleEditDevice = async () => {
        if (!editingDevice) return;

        if (!editDeviceName.trim()) {
            Alert.alert('Error', 'Please enter a device name');
            return;
        }

        try {
            const { error } = await supabase
                .from('devices')
                .update({
                    device_name: editDeviceName.trim(),
                    device_location: editDeviceLocation.trim() || null,
                })
                .eq('id', editingDevice.id);

            if (error) throw error;

            Alert.alert('Success', 'Device updated successfully');
            setIsEditModalVisible(false);
            setEditingDevice(null);
            if (user?.id) {
                await fetchDevices(user.id);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update device');
        }
    };

    const handleDeleteDevice = (device: Device) => {
        Alert.alert(
            'Delete Device',
            `Are you sure you want to delete "${device.device_name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('devices')
                                .delete()
                                .eq('id', device.id);

                            if (error) throw error;

                            Alert.alert('Success', 'Device deleted successfully');
                            if (user?.id) {
                                await fetchDevices(user.id);
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete device');
                        }
                    }
                }
            ]
        );
    };

    const openEditModal = (device: Device) => {
        setEditingDevice(device);
        setEditDeviceName(device.device_name);
        setEditDeviceLocation(device.device_location || '');
        setIsEditModalVisible(true);
    };

    const renderDevice = ({ item }: { item: Device }) => (
        <View style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.device_name}</Text>
                    {item.device_location && (
                        <Text style={styles.deviceLocation}>📍 {item.device_location}</Text>
                    )}
                    <Text style={styles.deviceId}>ID: {item.id}</Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.is_online ? colors.success : colors.gray400 }
                ]}>
                    <Text style={styles.statusText}>
                        {item.is_online ? 'Online' : 'Offline'}
                    </Text>
                </View>
            </View>

            <View style={styles.deviceActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.selectButton]}
                    onPress={() => selectDevice(item)}
                >
                    <Text style={styles.actionButtonText}>
                        {selectedDevice?.id === item.id ? '✓ Selected' : 'Select'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openEditModal(item)}
                >
                    <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteDevice(item)}
                >
                    <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Device Management</Text>
                <Text style={styles.subtitle}>Manage your ESP32 devices</Text>
            </View>

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAddModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+ Add New Device</Text>
            </TouchableOpacity>

            <FlatList
                data={devices}
                renderItem={renderDevice}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No devices yet</Text>
                        <Text style={styles.emptySubtext}>Add your first ESP32 device to get started</Text>
                    </View>
                }
            />

            {/* Add Device Modal */}
            <Modal
                visible={isAddModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Device</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Device Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Water Tank 1"
                                value={newDeviceName}
                                onChangeText={setNewDeviceName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Backyard"
                                value={newDeviceLocation}
                                onChangeText={setNewDeviceLocation}
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setIsAddModalVisible(false);
                                    setNewDeviceName('');
                                    setNewDeviceLocation('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleAddDevice}
                            >
                                <Text style={styles.saveButtonText}>Add Device</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Device Modal */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Device</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Device Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Device name"
                                value={editDeviceName}
                                onChangeText={setEditDeviceName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Device location"
                                value={editDeviceLocation}
                                onChangeText={setEditDeviceLocation}
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setIsEditModalVisible(false);
                                    setEditingDevice(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleEditDevice}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
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
    addButton: {
        backgroundColor: colors.primary,
        margin: spacing.md,
        padding: spacing.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
    listContainer: {
        padding: spacing.md,
    },
    deviceCard: {
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
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    deviceLocation: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    deviceId: {
        fontSize: typography.fontSize.xs,
        color: colors.gray400,
        fontFamily: 'monospace',
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 12,
        height: 24,
        justifyContent: 'center',
    },
    statusText: {
        color: colors.white,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
    },
    deviceActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
        padding: spacing.sm,
        borderRadius: 6,
        alignItems: 'center',
    },
    selectButton: {
        backgroundColor: colors.primary,
    },
    editButton: {
        backgroundColor: colors.secondary,
    },
    deleteButton: {
        backgroundColor: colors.danger,
    },
    actionButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: spacing['2xl'],
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: spacing.lg,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.textPrimary,
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
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    modalButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.gray300,
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    cancelButtonText: {
        color: colors.textPrimary,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
});
