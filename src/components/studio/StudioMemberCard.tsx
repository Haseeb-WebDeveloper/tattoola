import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { StudioMember } from "@/services/studio.invitation.service";
import { mvs, s } from "@/utils/scale";
import React from "react";
import {
    ActivityIndicator,
    Image,
    TouchableOpacity,
    View,
} from "react-native";
import { StudioCardContainer } from "./StudioCardContainer";

interface StudioMemberCardProps {
  item: StudioMember;
  isRemoving: boolean;
  isResending: boolean;
  onRemove: (member: StudioMember) => void;
  onResend: (invitationId: string) => void;
}

const resolveImageUrl = (url?: string | null) => {
  if (!url) return undefined;
  try {
    if (url.includes("imgres") && url.includes("imgurl=")) {
      const u = new URL(url);
      const real = u.searchParams.get("imgurl");
      return real || url;
    }
    return url;
  } catch {
    return url;
  }
};

export const StudioMemberCard: React.FC<StudioMemberCardProps> = ({
  item,
  isRemoving,
  isResending,
  onRemove,
  onResend,
}) => {
  const avatarUrl = resolveImageUrl(item.user.avatar);
  const fullName = [item.user.firstName, item.user.lastName]
    .filter(Boolean)
    .join(" ");
  const isPending = item.status === "PENDING";
  const locationText = item.location
    ? `${item.location.municipality} (${item.location.province})`
    : "Località non impostata";
  const diamondType = item.planType === "STUDIO" ? "red" : "yellow";

  return (
    <StudioCardContainer showDiamond diamondType={diamondType}>
      {/* First Row: Avatar and User Info */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: mvs(12),
        }}
      >
        <View
          style={{
            width: s(57),
            height: s(57),
            borderRadius: s(57),
            overflow: "hidden",
            marginRight: s(12),
            backgroundColor: "#2A2A2A",
          }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SVGIcons.User width={s(30)} height={s(30)} />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: mvs(2),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-montserratSemibold"
              style={{ marginRight: s(4), fontWeight: "600" }}
            >
              @{item.user.username}
            </ScaledText>
            <SVGIcons.VarifiedGreen width={s(17)} height={s(17)} />
          </View>
          {fullName ? (
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-gray font-neueLight"
              numberOfLines={1}
            >
              {fullName}
            </ScaledText>
          ) : null}
           <View style={{ height: mvs(2) }} />
           <ScaledText
             allowScaling={false}
             variant="11"
             className="text-gray font-neueLight"
             style={{ flexDirection: "row", alignItems: "center" }}
           >
             <SVGIcons.LocationsGray width={s(8)} height={s(8)} /> {locationText}
           </ScaledText>
        </View>
      </View>

      {/* Second Row: Status Chip and Action Buttons */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: s(8),
          flexWrap: "wrap",
        }}
      >
        {isPending ? (
          <>
            <View
              className="rounded-full"
              style={{
                backgroundColor: "#F49E00",
                paddingVertical: mvs(7),
                paddingHorizontal: s(16),
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <SVGIcons.Pending width={s(14)} height={s(14)} />
              <ScaledText
                allowScaling={false}
                variant="11"
                className="text-white font-neueMedium"
                style={{ marginLeft: s(6) }}
              >
                In attesa di conferma
              </ScaledText>
            </View>
            {/* <TouchableOpacity
              onPress={() => onRemove(item)}
              disabled={isRemoving}
              className="rounded-full"
              style={{
                borderWidth: s(0.5),
                borderColor: "#A49A99",
                paddingVertical: mvs(7),
                paddingHorizontal: s(16),
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" />
              ) : (
                <>
                  <SVGIcons.CloseRedBold width={s(10)} height={s(10)} className="opacity-50" />
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-gray font-neueMedium"
                    style={{ marginLeft: s(6) }}
                  >
                    Cancel collab
                  </ScaledText>
                </>
              )}
            </TouchableOpacity> */}
          </>
        ) : (
          <>
            <View
              className="rounded-full"
              style={{
                backgroundColor: "#11B95C",
                paddingVertical: mvs(7),
                paddingHorizontal: s(16),
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <SVGIcons.Check width={s(14)} height={s(14)} />
              <ScaledText
                allowScaling={false}
                variant="11"
                className="text-white font-neueMedium"
                style={{ marginLeft: s(6) }}
              >
                Artista collegato
              </ScaledText>
            </View>
            <TouchableOpacity
              onPress={() => onRemove(item)}
              disabled={isRemoving}
              className="rounded-full"
              style={{
                borderWidth: s(0.5),
                borderColor: "#A49A99",
                paddingVertical: mvs(7),
                paddingHorizontal: s(16),
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" />
              ) : (
                <>
                  <SVGIcons.CloseRedBold width={s(10)} height={s(10)} className="opacity-50" />
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-gray font-neueMedium"
                    style={{ marginLeft: s(6) }}
                  >
                    Cancel collab
                  </ScaledText>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </StudioCardContainer>
  );
};

