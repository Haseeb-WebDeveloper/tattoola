import { View } from "react-native";
import { ScaledText } from "./ScaledText";
import { addEmojiWithStyle } from "@/utils/content/add-emoji-with-style";
import { mvs, s } from "@/utils/scale";
import { SVGIcons } from "@/constants/svg";

export const StylePills = ({
  styles,
}: {
  styles: { id: string; name: string; isFavorite?: boolean }[];
}) => {
  return (
    <View className="flex-row flex-wrap gap-2" style={{ marginTop: mvs(8) }}>
      {styles.map((style) => (
        <View
          key={style.id}
          className=" rounded-full relative"
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
            variant="11"
            className="text-white font-neueBold"
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
      ))}
    </View>
  );
};
