import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs } from "@/utils/scale";

type Props = {
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
  caption?: string;
  editMode: boolean;
  isActive: boolean;
  onPress: () => void;
  onDragHandlePressIn?: () => void;
  onDeletePress?: () => void;
  width: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  fixedHeight?: number; // when provided, force fixed height (edit mode)
};

export default function CollectionPostCard({
  thumbnailUrl,
  mediaUrl,
  caption,
  editMode,
  isActive,
  onPress,
  onDragHandlePressIn,
  onDeletePress,
  width,
  marginLeft,
  marginRight,
  marginTop,
  fixedHeight,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      delayLongPress={200}
      disabled={isActive}
      style={{ width, marginLeft, marginRight, marginTop }}
    >
      <View
        className={
          editMode ? "relative w-full" : "relative aspect-[9/16] w-full"
        }
        style={{
          opacity: isActive ? 0.7 : 1,
          transform: [{ scale: isActive ? 1.05 : 1 }],
          height: fixedHeight,
        }}
      >
        <Image
          source={{ uri: thumbnailUrl || mediaUrl || undefined }}
          className={
            editMode
              ? "w-full h-full rounded-lg"
              : "w-full aspect-[9/16] rounded-lg"
          }
          style={
            fixedHeight ? { height: fixedHeight, width: "100%" } : undefined
          }
          resizeMode="cover"
        />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,1)"]}
          className="absolute bottom-0 left-0 right-0 rounded-b-lg"
          style={{ padding: 12 }}
        >
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-foreground font-neueMedium"
            numberOfLines={1}
          >
            {caption || "Descrizione del tatuaggio"}
          </ScaledText>
        </LinearGradient>

        {editMode && (
          <>
            <TouchableOpacity
              className="absolute top-2 left-2 w-8 h-8 rounded-full items-center justify-center"
              onPressIn={onDragHandlePressIn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <SVGIcons.Drag className="w-6 h-6" />
            </TouchableOpacity>

            <TouchableOpacity
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground items-center justify-center"
              onPress={onDeletePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <SVGIcons.Trash className="w-4 h-4" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
