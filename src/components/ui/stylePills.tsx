import { SVGIcons } from "@/constants/svg";
import { addEmojiWithStyle } from "@/utils/content/add-emoji-with-style";
import { mvs, s } from "@/utils/scale";
import { TouchableOpacity, View } from "react-native";
import { ScaledText } from "./ScaledText";

type StylePillSize = "small" | "medium";

export const StylePills = ({
  styles,
  onStylePress,
  size = "medium",
}: {
  styles: {
    id: string;
    name: string;
    isFavorite?: boolean;
    imageUrl?: string | null;
    description?: string | null;
  }[];
  onStylePress?: (style: {
    id: string;
    name: string;
    imageUrl?: string | null;
    description?: string | null;
  }) => void;
  size?: StylePillSize;
}) => {
  // Filter out invalid styles (where id or name is missing)
  const validStyles = styles.filter((style) => style.id && style.name);

  if (validStyles.length === 0) {
    return null;
  }

  // Size-specific styling
  const sizeStyles = {
    small: {
      paddingHorizontal: s(8),
      paddingVertical: mvs(3),
      borderWidth: s(0.5),
      textVariant: "xs" as const,
      iconSize: s(11),
      iconTop: s(-7),
      iconRight: s(0),
    },
    medium: {
      paddingHorizontal: s(12),
      paddingVertical: mvs(4),
      borderWidth: s(1),
      textVariant: "md" as const,
      iconSize: s(14),
      iconTop: s(-9),
      iconRight: s(1),
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View className="flex-row flex-wrap gap-2" style={{ marginTop: mvs(8) }}>
      {validStyles.map((style) => {
        const PillContent = (
          <View
            className="relative rounded-full "
            style={{
              paddingHorizontal: currentSize.paddingHorizontal,
              paddingVertical: currentSize.paddingVertical,
              justifyContent: "center",
              borderWidth: currentSize.borderWidth,
              borderColor: "#fff",
            }}
          >
            <ScaledText
              allowScaling={false}
              variant={currentSize.textVariant}
              className="text-white font-neueMedium"
            >
              {addEmojiWithStyle(style.name)}
            </ScaledText>

            {/* For fav we show icon */}
            {style.isFavorite && (
              <SVGIcons.King
                width={currentSize.iconSize}
                height={currentSize.iconSize}
                style={{
                  position: "absolute",
                  right: currentSize.iconRight,
                  top: currentSize.iconTop,
                }}
              />
            )}
          </View>
        );

        if (onStylePress) {
          return (
            <TouchableOpacity
              key={style.id}
              onPress={() => onStylePress(style)}
              activeOpacity={0.7}
            >
              {PillContent}
            </TouchableOpacity>
          );
        }

        return <View key={style.id}>{PillContent}</View>;
      })}
    </View>
  );
};
