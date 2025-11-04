import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface CustomToastProps {
  message: string;
  actionText?: string;
  onAction?: () => void;
  onClose: () => void;
  iconType?: "success" | "error" | "warning";
}

export const CustomToast: React.FC<CustomToastProps> = ({
  message,
  actionText,
  onAction,
  onClose,
  iconType = "success",
}) => {
  // Determine icon and background color based on type
  const getIconConfig = () => {
    switch (iconType) {
      case "success":
        return {
          icon: <SVGIcons.Success width={s(24)} height={s(24)} />,
          backgroundColor: "rgba(1,225,123,0.1)",
        };
      case "error":
        return {
          icon: <SVGIcons.Error width={s(24)} height={s(24)} />,
          backgroundColor: "rgba(239,68,68,0.1)",
        };
      case "warning":
        return {
          icon: <SVGIcons.Warning width={s(24)} height={s(24)} />,
          backgroundColor: "rgba(250,204,21,0.1)",
        };
      default:
        return {
          icon: <SVGIcons.Success width={s(24)} height={s(24)} />,
          backgroundColor: "rgba(1,225,123,0.1)",
        };
    }
  };

  const { icon, backgroundColor } = getIconConfig();

  return (
    <View
      style={{
        backgroundColor: "#100C0C",
        borderWidth: 1,
        borderColor: "#A49A99",
        borderRadius: mvs(16),
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: mvs(12),
        paddingHorizontal: s(16),
        gap: s(12),
        // maxWidth: s(350),
        marginHorizontal: s(16),
      }}
    >
      {/* Icon Container */}
      <View
        style={{
        //   width: s(32),
        //   height: s(32),
        //   borderRadius: s(50),
        //   backgroundColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>

      {/* Text Content */}
      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-foreground font-neueLight"
        >
          {message}
        </ScaledText>
        {actionText && onAction && (
          <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueSemibold"
            >
              {actionText}
            </ScaledText>
          </TouchableOpacity>
        )}
      </View>

      {/* Close Button */}
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.7}
        style={{
          width: s(24),
          height: s(24),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SVGIcons.CloseGray width={s(12)} height={s(12)} />
      </TouchableOpacity>
    </View>
  );
};

