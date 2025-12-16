import { HelpHeader } from "@/components/help/HelpHeader";
import { getHelpArticle } from "@/services/help.service";
import type { HelpArticle } from "@/types/help";
import { mvs, s } from "@/utils/scale";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, useWindowDimensions, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import ScaledText from "@/components/ui/ScaledText";
import RenderHTML from "react-native-render-html";

// Shared cache across instances
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

      const cached = cacheRef.current.get(articleId);

      if (cached) {
        setArticle(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const data = await getHelpArticle(articleId);
        if (data) {
          cacheRef.current.set(articleId, data);
          setArticle(data);
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        if (!cached) setArticle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  /**
   * HTML styles
   * - body: auto (LTR/RTL safe)
   * - p: justify
   * - lists & headings: left
   */
  const htmlStyles = useMemo(
    () => ({
      body: {
        color: "#FFFFFF",
        fontSize: s(14),
        lineHeight: s(24),
        fontFamily: "NeueHaasDisplay-Light",
        textAlign: "auto" as const,
        margin: 0,
        padding: 0,
      },
      p: {
        color: "#FFFFFF",
        fontSize: s(12),
        lineHeight: s(24),
        fontFamily: "NeueHaasDisplay-Light",
        marginBottom: mvs(16),
        marginTop: 0,
        textAlign: "justify" as const,
      },
      strong: {
        fontFamily: "NeueHaasDisplay-Bold",
        fontWeight: "700" as const,
        color: "#FFFFFF",
      },
      h1: {
        fontFamily: "NeueHaasDisplay-Bold",
        fontSize: s(16),
        lineHeight: s(24),
        marginVertical: mvs(16),
        color: "#FFFFFF",
        textAlign: "left" as const,
      },
      h2: {
        fontFamily: "NeueHaasDisplay-Bold",
        fontSize: s(15),
        lineHeight: s(23),
        marginVertical: mvs(16),
        color: "#FFFFFF",
        textAlign: "left" as const,
      },
      h3: {
        fontFamily: "NeueHaasDisplay-Bold",
        fontSize: s(14),
        lineHeight: s(22),
        marginVertical: mvs(16),
        color: "#FFFFFF",
        textAlign: "left" as const,
      },
      ul: {
        marginBottom: mvs(16),
        paddingLeft: s(16),
        textAlign: "left" as const,
      },
      ol: {
        marginBottom: mvs(16),
        paddingLeft: s(16),
        textAlign: "left" as const,
      },
      li: {
        fontSize: s(14),
        lineHeight: s(22),
        fontFamily: "NeueHaasDisplay-Light",
        marginBottom: mvs(8),
        color: "#FFFFFF",
        textAlign: "left" as const,
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

  /**
   * Wider content width = fewer justification gaps
   */
  const contentWidth = useMemo(() => width - s(32), [width]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <HelpHeader />

        <View
          style={{
            height: 0.5,
            backgroundColor: "#A49A99",
            marginHorizontal: s(20),
            marginBottom: mvs(16),
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator
          contentContainerStyle={{
            paddingHorizontal: s(20),
            paddingBottom: mvs(32) + insets.bottom,
          }}
        >
          {article && (
            <>
              <ScaledText
                allowScaling={false}
                variant="2xl"
                style={{
                  fontSize: s(24),
                  lineHeight: s(31),
                  fontFamily: "ProductSans",
                  fontWeight: "bold",
                  paddingVertical: mvs(28),
                  color: "#FFFFFF",
                }}
              >
                {article.title}
              </ScaledText>

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
      </SafeAreaView>
    </View>
  );
}
