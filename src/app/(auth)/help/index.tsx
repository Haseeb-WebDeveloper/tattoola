import { HelpCategoryItem } from "@/components/help/HelpCategoryItem";
import { HelpHeader } from "@/components/help/HelpHeader";
import { HelpTabs } from "@/components/help/HelpTabs";
import { useAuth } from "@/providers/AuthProvider";
import { getHelpCategories } from "@/services/help.service";
import type { HelpCategory, HelpTab } from "@/types/help";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  // Set default tab based on user role: artists see artist tab, users see user tab
  const [activeTab, setActiveTab] = useState<HelpTab>(
    user?.role === "TATTOO_LOVER" ? "utenti" : "artisiti"
  );

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

  // Get current category type based on active tab
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
      const isLoggedIn = !!user;

      // Check if logged in user's role matches the current tab
      let shouldShowCategories = true;
      if (isLoggedIn && user.role) {
        const userType = user.role === "ARTIST" ? "ARTIST" : "USER";
        // Only show categories if tab matches user's role
        shouldShowCategories = type === userType;
      }

      // If shouldn't show categories (wrong tab for logged in user), set empty and return
      if (!shouldShowCategories) {
        setCachedCategories((prev) => ({
          ...prev,
          [type]: [],
        }));
        setLoading(false);
        return;
      }

      // Check if we have cached data for this tab using ref
      const hasCachedData = cacheRef.current[type].length > 0;

      // Only show loading if we don't have cached data
      if (!hasCachedData) {
        setLoading(true);
      }

      try {
        // Pass isLoggedIn to get appropriate categories:
        // - If logged in: get ALL categories (public + auth-required)
        // - If not logged in: get only public categories (loginRequired: false)
        const categories = await getHelpCategories(type, isLoggedIn);

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
  }, [activeTab, user]);

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
