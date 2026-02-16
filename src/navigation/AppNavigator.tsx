import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ActivityClockScreen from "../screens/ActivityClockScreen";
import HabitTrackerScreen from "../screens/HabitTrackerScreen";
import { colors } from "../styles/theme";

export type RootTabParamList = {
  Activity: undefined;
  Habits: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.ink },
        tabBarStyle: { backgroundColor: colors.surface },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name="Activity"
        component={ActivityClockScreen}
        options={{ title: "Activity Clock" }}
      />
      <Tab.Screen
        name="Habits"
        component={HabitTrackerScreen}
        options={{ title: "Habit Tracker" }}
      />
    </Tab.Navigator>
  );
}
