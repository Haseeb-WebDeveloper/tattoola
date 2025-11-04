import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";

interface StudioCardContainerProps {
  children: React.ReactNode;
  showDiamond?: boolean;
  diamondType?: "yellow" | "red";
}

export const StudioCardContainer: React.FC<StudioCardContainerProps> = ({
  children,
  showDiamond = false,
  diamondType = "yellow",
}) => (
  <View
    className="bg-tat-foreground border-gray"
    style={{
      borderWidth: s(0.5),
      marginBottom: mvs(16),
      paddingHorizontal: s(14),
      paddingVertical: mvs(12),
      borderRadius: s(12),
    }}
  >
    {showDiamond && (
      <View style={{ position: "absolute", right: s(12), top: s(10) }}>
        {diamondType === "red" ? (
          <SVGIcons.DimondRed width={s(16)} height={s(16)} />
        ) : (
          <SVGIcons.DimondYellow width={s(16)} height={s(16)} />
        )}
      </View>
    )}
    {children}
  </View>
);

