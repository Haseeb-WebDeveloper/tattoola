import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { HelpTab } from "@/types/help";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface HelpTabsProps {
  activeTab: HelpTab;
  onTabChange: (tab: HelpTab) => void;
  isLoggedIn: boolean;
}

export function HelpTabs({
  activeTab,
  onTabChange,
  isLoggedIn,
}: HelpTabsProps) {
  // Hide tabs when user is logged in
  if (isLoggedIn) {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: s(20),
        marginBottom: mvs(24),
        gap: s(12),
      }}
    >
            {/* Utenti Tab */}
      <TouchableOpacity
        onPress={() => onTabChange("utenti")}
        activeOpacity={0.8}
        style={{
          flex: 1,
          height: mvs(25),
          borderRadius: s(17.747),
          backgroundColor:
            activeTab === "utenti" ? "rgba(179, 29, 29, 1)" : "transparent",
          borderWidth: 1,
          borderColor:
            activeTab === "utenti" ? "rgba(179, 29, 29, 1)" : "#A49A99",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: s(6),
        }}
      >
        <SVGIcons.Users width={s(12)} height={s(12)} />
        <ScaledText
          allowScaling={false}
          variant="sm"
          className={activeTab === "utenti" ? "text-foreground" : "text-gray"}
          style={{
            fontSize: s(11),
            lineHeight: s(14.3),
            fontFamily: "font-neueSemibold",
          }}
        >
          Utenti
        </ScaledText>
      </TouchableOpacity>
      {/* Artisti Tab */}
      <TouchableOpacity
        onPress={() => onTabChange("artisiti")}
        activeOpacity={0.8}
        style={{
          flex: 1,
          height: mvs(25),
          borderRadius: s(17.747),
          backgroundColor:
            activeTab === "artisiti" ? "rgba(179, 29, 29, 1)" : "transparent",
          borderWidth: 1,
          borderColor:
            activeTab === "artisiti" ? "rgba(179, 29, 29, 1)" : "#A49A99",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: s(6),
        }}
      >
        <SVGIcons.ArtistMaachine width={s(14)} height={s(14)} />
        <ScaledText
          allowScaling={false}
          variant="sm"
          className={activeTab === "artisiti" ? "text-foreground" : "text-gray"}
          style={{
            fontSize: s(11),
            lineHeight: s(14.3),
            fontFamily: "font-neueSemibold",
          }}
        >
          Artisti
        </ScaledText>
      </TouchableOpacity>


    </View>
  );
}
