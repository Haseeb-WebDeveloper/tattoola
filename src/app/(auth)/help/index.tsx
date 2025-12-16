import { HelpCategoryItem } from "@/components/help/HelpCategoryItem";
import { HelpHeader } from "@/components/help/HelpHeader";
import { HelpTabs } from "@/components/help/HelpTabs";
import { useAuth } from "@/providers/AuthProvider";
import { getHelpCategories } from "@/services/help.service";
import type { HelpCategory, HelpTab } from "@/types/help";
import { mvs, s } from "@/utils/scale";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<HelpTab>("artisiti");

  // Cache categories for both tabs
  const [cachedCategories, setCachedCategories] = useState<{
    ARTIST: HelpCategory[];
    USER: HelpCategory[];
  }>({
    ARTIST: [],
    USER: [],
  });

  // Ref to track cache for checking without causing re-renders
  const cacheRef = useRef(cachedCategories);

  // Keep ref in sync with state
  useEffect(() => {
    cacheRef.current = cachedCategories;
  }, [cachedCategories]);

  const [loading, setLoading] = useState(true);

  // Map tab to category type
  const getCategoryType = useCallback((tab: HelpTab): "USER" | "ARTIST" => {
    return tab === "artisiti" ? "ARTIST" : "USER";
  }, []);

  // Get current category type
  const currentCategoryType = useMemo(
    () => getCategoryType(activeTab),
    [activeTab, getCategoryType]
  );

  // Get cached categories for current tab (shows immediately)
  const helpCategories = useMemo(
    () => cachedCategories[currentCategoryType],
    [cachedCategories, currentCategoryType]
  );

  // Fetch categories when tab changes or on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const type = getCategoryType(activeTab);
      // If user is logged in (coming from feed/app), show only loginRequired=true.
      // If not logged in (e.g. from sign-in), show only loginRequired=false.
      const loginRequiredFilter = !!user;
      
      // Check if we have cached data for this tab using ref
      const hasCachedData = cacheRef.current[type].length > 0;

      // Only show loading if we don't have cached data
      if (!hasCachedData) {
        setLoading(true);
      }

      try {
        const categories = await getHelpCategories(type, loginRequiredFilter);
        // Update cache for this tab type (this will show new categories if added)
        setCachedCategories((prev) => ({
          ...prev,
          [type]: categories,
        }));
      } catch (error) {
        console.error("Error fetching help categories:", error);
        // Only set empty if we don't have cached data
        if (!hasCachedData) {
          setCachedCategories((prev) => ({
            ...prev,
            [type]: [],
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Header */}
      <HelpHeader />

      {/* Divider */}
      <View
        style={{
          height: 0.5,
          backgroundColor: "#A49A99",
          marginHorizontal: s(20),
          marginBottom: mvs(16),
        }}
      />

      {/* Tabs */}
      <HelpTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator
        contentContainerStyle={{
          paddingHorizontal: s(20),
          paddingBottom: mvs(32) + insets.bottom,
        }}
        style={{ flex: 1 }}
      >
        {/* Help Categories */}
        {helpCategories.map((category, index) => (
          <HelpCategoryItem
            key={category.id}
            category={category}
            isLast={index === helpCategories.length - 1}
          />
        ))}
      </ScrollView>
    </View>
  );
}
