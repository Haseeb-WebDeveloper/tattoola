import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { FollowingUser } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import { useRouter } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

interface ArtistCardProps {
  artist: FollowingUser;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const router = useRouter();
  
  const fullName = [artist.firstName, artist.lastName].filter(Boolean).join(" ");
  const location = artist.location
    ? `${artist.location.municipality || ""}${artist.location.province ? ` (${artist.location.province})` : ""}`
    : "";

  const handlePress = () => {
    router.push(`/user/${artist.id}` as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      className="bg-tat-foreground border-gray"
      style={{
        borderWidth: s(0.5),
        marginBottom: mvs(16),
        height: mvs(97),
        paddingHorizontal: s(14),
        paddingVertical: mvs(10),
        flexDirection: "row",
        alignItems: "center",
        borderRadius: s(12),
      }}
    >
      {/* Avatar */}
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
        {artist.avatar ? (
          <Image
            source={{ uri: artist.avatar }}
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

      {/* Artist Info */}
      <View style={{ flex: 1 }}>
        {/* Username with verification badge */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: mvs(2) }}>
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground font-montserratSemibold"
            style={{ marginRight: s(4), fontWeight: "600" }}
          >
            @{artist.username}
          </ScaledText>
          <SVGIcons.VarifiedGreen width={s(17)} height={s(17)} />
        </View>

        {/* Full name */}
        {fullName && (
          <ScaledText
            allowScaling={false}
            variant="11"
            className="text-gray font-neueLight"
            numberOfLines={1}
            style={{ marginBottom: mvs(3) }}
          >
            {fullName}
          </ScaledText>
        )}

        {/* Location */}
        {location && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <SVGIcons.LocationsGray width={s(10)} height={s(10)} style={{ marginRight: s(2) }} />
            <ScaledText
              allowScaling={false}
              variant="body4"
              className="text-gray"
              numberOfLines={1}
              style={{ fontWeight: "400" }}
            >
              {location}
            </ScaledText>
          </View>
        )}
      </View>

      {/* Subscription Icon */}
      {artist.subscriptionPlanType && (
        <View style={{ position: "absolute", top: mvs(7), right: s(14) }}>
          {artist.subscriptionPlanType === "PREMIUM" ? (
            <SVGIcons.DimondYellow width={s(14)} height={s(14)} />
          ) : artist.subscriptionPlanType === "STUDIO" ? (
            <SVGIcons.DimondRed width={s(14)} height={s(14)} />
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

