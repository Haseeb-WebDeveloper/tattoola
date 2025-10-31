import { View } from "react-native";
import { ScaledText } from "./ScaledText";
import { addEmojiWithStyle } from "@/utils/content/add-emoji-with-style";
import { mvs, s } from "@/utils/scale";

export const StylePills = ({
  styles,
}: {
  styles: { id: string; name: string }[];
}) => {
  return (
    <View className="flex-row flex-wrap gap-2" style={{ marginTop: mvs(8) }}>
      {styles.map((style) => (
        <View
          key={style.id}
          className=" rounded-full"
          style={{
            paddingHorizontal: s(12),
            paddingVertical: mvs(4),
            justifyContent: "center",
            borderWidth: s(1),
            borderColor: "#fff",
          }}
        >
          <ScaledText
            allowScaling={false}
            variant="11"
            className="text-white font-neueBold"
          >
            {addEmojiWithStyle(style.name)}
          </ScaledText>
        </View>
      ))}
    </View>
  );
};
