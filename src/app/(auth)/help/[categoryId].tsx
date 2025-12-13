import { HelpArticleItem } from "@/components/help/HelpArticleItem";
import { HelpHeader } from "@/components/help/HelpHeader";
import { getHelpArticles, getHelpCategory } from "@/services/help.service";
import type { HelpArticle, HelpCategory } from "@/types/help";
import { mvs, s } from "@/utils/scale";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import ScaledText from "@/components/ui/ScaledText";

export default function HelpCategoryDetailScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return;

      try {
        setLoading(true);
        const [categoryData, articlesData] = await Promise.all([
          getHelpCategory(categoryId),
          getHelpArticles(categoryId),
        ]);
        setCategory(categoryData);
        setArticles(articlesData);
      } catch (error) {
        console.error("Error fetching category details:", error);
        setCategory(null);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

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

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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

        {/* Category Title */}
        {category && (
          <View
            style={{
              paddingHorizontal: s(20),
              paddingTop: mvs(14),
              paddingBottom: mvs(12),
              alignItems: "center",
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-neueSemibold"
              style={{
                fontSize: s(16),
                lineHeight: s(23),
                textAlign: "center",
              }}
            >
              {category.title}
            </ScaledText>
          </View>
        )}

        {/* Articles List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: mvs(40) + insets.bottom,
            paddingHorizontal: s(42),
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: s(297),
              maxWidth: "100%",
            }}
          >
            {articles.map((article, index) => (
              <HelpArticleItem
                key={article.id}
                article={article}
                isLast={index === articles.length - 1}
                categoryId={categoryId}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
