import Constants from "expo-constants";
import { Platform } from "react-native";

const envBase = process.env.EXPO_PUBLIC_API_BASE;
const extraBase = Constants.expoConfig?.extra?.apiBase as string | undefined;
const defaultBase =
  Platform.OS === "android" ? "http://10.0.2.2:8888" : "http://localhost:8888";

const rawBase = (envBase || extraBase || defaultBase).trim();
const normalizedBase = rawBase.replace(/\/+$/, "");

export const API_BASE_URL = normalizedBase;
export const API_BASE = `${API_BASE_URL}/api`;

export const CONTENT_TYPE_JSON = "application/json";
export const ACTIVITY_NAMES_ENDPOINT = `${API_BASE}/activityNames`;
export const ACTIVITY_LOGS_ENDPOINT = `${API_BASE}/activityLogs`;
export const HABITS_ENDPOINT = `${API_BASE}/habits`;
