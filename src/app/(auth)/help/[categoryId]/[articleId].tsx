import { HelpHeader } from "@/components/help/HelpHeader";
import { getHelpArticle } from "@/services/help.service";
import type { HelpArticle } from "@/types/help";
import { mvs, s } from "@/utils/scale";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import ScaledText from "@/components/ui/ScaledText";
import RenderHTML from "react-native-render-html";

// Cache articles by ID (shared across component instances)
const articleCache = new Map<string, HelpArticle>();

export default function HelpArticleDetailScreen() {
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef(articleCache);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;

      // Check if we have cached data for this article
      const cachedArticle = cacheRef.current.get(articleId);
      if (cachedArticle) {
        // Show cached data immediately
        setArticle(cachedArticle);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const articleData = await getHelpArticle(articleId);
        if (articleData) {
          // Update cache and state
          cacheRef.current.set(articleId, articleData);
          setArticle(articleData);
        } else {
          setArticle(null);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
        // Only set null if we don't have cached data
        if (!cachedArticle) {
          setArticle(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  // HTML rendering styles - memoized to avoid recreation on every render
  const htmlStyles = useMemo(
    () => ({
      body: {
        color: "#FFFFFF",
        fontSize: s(14),
        lineHeight: s(23),
        fontFamily: "NeueHaasDisplay-Light",
        padding: 0,
        margin: 0,
        textAlign: "justify" as const,
      },
      p: {
        color: "#FFFFFF",
        fontSize: s(14),
        lineHeight: s(23),
        fontFamily: "NeueHaasDisplay-Light",
        marginBottom: mvs(16),
        marginTop: 0,
        textAlign: "justify" as const,
      },
      strong: {
        color: "#FFFFFF",
        fontSize: s(14),
        lineHeight: s(23),
        fontFamily: "NeueHaasDisplay-Bold",
        fontWeight: "700" as const,
      },
      h1: {
        color: "#FFFFFF",
        fontSize: s(14),
        lineHeight: s(23),
        fontFamily: "NeueHaasDisplay-Bold",
        fontWeight: "700" as const,
        marginBottom: mvs(16),
        marginTop: mvs(16),
      },
      h2: {
        color: "#FFFFFF",
        fontSize: s(14),
        lineHeight: s(23),
        fontFamily: "NeueHaasDisplay-Bold",
        fontWeight: "700" as const,
        marginBottom: mvs(16),
        marginTop: mvs(16),
      },
      h3: {
        color: "#FFFFFF",
        fontSize: s(14),
        lineHeight: s(23),
        fontFamily: "NeueHaasDisplay-Bold",
        fontWeight: "700" as const,
        marginBottom: mvs(16),
        marginTop: mvs(16),
      },
      ul: {
        color: "#FFFFFF",
        fontSize: s(14),
        lineHeight: s(23),
        fontFamily: "NeueHaasDisplay-Light",
        marginBottom: mvs(16),
      },
      ol: {
        color: "#FFFFFF",
        fontSize: s(14),
        lineHeight: s(23),
        fontFamily: "NeueHaasDisplay-Light",
        marginBottom: mvs(16),
      },
      li: {
        color: "#FFFFFF",
        fontSize: s(14),
        lineHeight: s(23),
        fontFamily: "NeueHaasDisplay-Light",
        marginBottom: mvs(8),
      },
    }),
    []
  );

  const tagsStyles = useMemo(
    () => ({
      body: htmlStyles.body,
      p: htmlStyles.p,
      strong: htmlStyles.strong,
      h1: htmlStyles.h1,
      h2: htmlStyles.h2,
      h3: htmlStyles.h3,
      ul: htmlStyles.ul,
      ol: htmlStyles.ol,
      li: htmlStyles.li,
    }),
    [htmlStyles]
  );

  // Memoize content width calculation
  const contentWidth = useMemo(() => width - s(84), [width]);

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

      {/* Article Content */}
      <ScrollView
        showsVerticalScrollIndicator
        contentContainerStyle={{
          paddingHorizontal: s(28),
          paddingBottom: mvs(32) + insets.bottom,
        }}
        style={{ flex: 1 }}
      >
        {/* Article Title */}
        {article && (
          <>
            <ScaledText
              allowScaling={false}
              variant="2xl"
              className="text-foreground"
              style={{
                fontSize: s(24),
                lineHeight: s(31.2),
                fontFamily: "ProductSans",
                fontWeight: "bold",
                paddingVertical: mvs(28),
              }}
            >
              {article.title}
            </ScaledText>

            {/* HTML Content */}
            {article.description && (
              <RenderHTML
                contentWidth={contentWidth}
                source={{ html: article.description }}
                tagsStyles={tagsStyles}
                baseStyle={htmlStyles.body}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
