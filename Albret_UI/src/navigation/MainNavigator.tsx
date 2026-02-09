import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '@/screens/main/DashboardScreen';
import ControlsScreen from '@/screens/main/ControlsScreen';
import AlertsScreen from '@/screens/main/AlertsScreen';
import SettingsScreen from '@/screens/main/SettingsScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';
import DeviceManagementScreen from '@/screens/main/DeviceManagementScreen';
import ThresholdSettingsScreen from '@/screens/main/ThresholdSettingsScreen';
import CalibrationSettingsScreen from '@/screens/main/CalibrationSettingsScreen';
import AlertPreferencesScreen from '@/screens/main/AlertPreferencesScreen';
import NotificationSettingsScreen from '@/screens/main/NotificationSettingsScreen';
import ChangePasswordScreen from '@/screens/auth/ChangePasswordScreen';
import { colors } from '@/theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Settings Stack Navigator
function SettingsStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="SettingsMain"
                component={SettingsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="DeviceManagement"
                component={DeviceManagementScreen}
                options={{ title: 'Device Management' }}
            />
            <Stack.Screen
                name="ThresholdSettings"
                component={ThresholdSettingsScreen}
                options={{ title: 'Sensor Thresholds' }}
            />
            <Stack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={{ title: 'Change Password' }}
            />
        </Stack.Navigator>
    );
}

export default function MainNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.gray500,
                tabBarStyle: {
                    backgroundColor: colors.white,
                    borderTopWidth: 1,
                    borderTopColor: colors.gray200,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: () => <></>,
                }}
            />
            <Tab.Screen
                name="Controls"
                component={ControlsScreen}
                options={{
                    tabBarLabel: 'Controls',
                    tabBarIcon: () => <></>,
                }}
            />
            <Tab.Screen
                name="Alerts"
                component={AlertsScreen}
                options={{
                    tabBarLabel: 'Alerts',
                    tabBarIcon: () => <></>,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsStack}
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: () => <></>,
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: () => <></>,
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    );
}
