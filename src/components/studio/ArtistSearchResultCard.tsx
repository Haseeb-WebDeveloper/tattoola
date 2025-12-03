import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { SearchArtistResult } from "@/services/studio.invitation.service";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";
import { StudioCardContainer } from "./StudioCardContainer";

interface ArtistSearchResultCardProps {
  item: SearchArtistResult;
  isInviting: boolean;
  onInvite: (artist: SearchArtistResult) => void;
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

export const ArtistSearchResultCard: React.FC<ArtistSearchResultCardProps> = ({
  item,
  isInviting,
  onInvite,
}) => {
  const avatarUrl = resolveImageUrl(item.avatar);
  const fullName = [item.firstName, item.lastName].filter(Boolean).join(" ");
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
              @{item.username}
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

      {/* Second Row: Action Button */}
      <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
        <TouchableOpacity
          onPress={() => onInvite(item)}
          disabled={isInviting}
          activeOpacity={0.85}
          className="bg-primary rounded-full"
          style={{
            alignSelf: "flex-start",
            paddingVertical: mvs(9),
            paddingHorizontal: s(16),
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {isInviting ? (
            <ActivityIndicator size="small" />
          ) : (
            <>
              <SVGIcons.Link width={s(12)} height={s(12)}  />
              <ScaledText
                allowScaling={false}
                variant="11"
                className="text-white font-neueLight"
                style={{ marginLeft: s(8) }}
              >
                Collega alla pagina studio
              </ScaledText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </StudioCardContainer>
  );
};
