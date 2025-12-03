import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { TouchableOpacity, View } from "react-native";

type LocationItem = {
  id: string;
  provinceId: string;
  provinceName: string;
  municipalityId: string;
  municipalityName: string;
  address?: string;
  isPrimary: boolean;
  isNew?: boolean;
};

interface LocationCardProps {
  location: LocationItem;
  isLast?: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onSetPrimary: () => void;
}

export function LocationCard({
  location,
  isLast = false,
  onEdit,
  onRemove,
  onSetPrimary,
}: LocationCardProps) {
  const displayText =
    location.provinceName && location.municipalityName
      ? `${location.municipalityName}, ${location.provinceName}`
      : "Seleziona posizione";

  return (
    <View
      className="bg-[#100C0C] rounded-xl border border-[#262626]"
      style={{
        padding: s(16),
        marginBottom: isLast ? mvs(16) : 0,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1" style={{ marginRight: s(12) }}>
          <View className="flex-row items-center">
            <ScaledText
              allowScaling={false}
              variant="sm"
              className={`font-montserratSemibold flex-1 ${location.provinceName ? "text-foreground" : "text-gray"}`}
            >
              {displayText}
            </ScaledText>
          </View>

          {/* {location.address && (
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-montserratMedium"
              style={{ marginTop: mvs(8) }}
            >
              {location.address}
            </ScaledText>
          )} */}
        </View>

        <View className="flex-row items-center" style={{ gap: s(12) }}>
          <TouchableOpacity onPress={onEdit}>
            <SVGIcons.Edit width={s(16)} height={s(16)} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove}>
            <SVGIcons.Delete width={s(16)} height={s(16)} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSetPrimary}>
            {location.isPrimary ? (
              <SVGIcons.StartCircleFilled width={s(16)} height={s(16)} />
            ) : (
              <SVGIcons.StartCircle width={s(16)} height={s(16)} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
