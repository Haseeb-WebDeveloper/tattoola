import { SVGIcons } from "@/constants/svg";
import { addEmojiWithStyle } from "@/utils/content/add-emoji-with-style";
import { mvs, s } from "@/utils/scale";
import { TouchableOpacity, View } from "react-native";
import { ScaledText } from "./ScaledText";

export const StylePills = ({
  styles,
  onStylePress,
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
}) => {
  // Filter out invalid styles (where id or name is missing)
  const validStyles = styles.filter((style) => style.id && style.name);

  if (validStyles.length === 0) {
    return null;
  }

  return (
    <View className="flex-row flex-wrap gap-2" style={{ marginTop: mvs(8) }}>
      {validStyles.map((style) => {
        const PillContent = (
          <View
            className="relative rounded-full "
            style={{
              paddingHorizontal: s(12),
              paddingVertical: mvs(4),
              justifyContent: "center",
              borderWidth: s(1),
              borderColor: "#fff",
              // borderColor: style.isFavorite ? "#AE0E0E" : "#fff",
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-neueRegular"
            >
              {addEmojiWithStyle(style.name)}
            </ScaledText>

            {/* For fav we show icon */}
            {style.isFavorite && (
              <SVGIcons.King
                width={s(14)}
                height={s(14)}
                style={{ position: "absolute", right: s(1), top: s(-9) }}
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
