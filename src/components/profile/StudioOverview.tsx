import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { buildGoogleMapsUrl } from "@/services/location.service";
import { mvs, s } from "@/utils/scale";
import {
  createInstagramUrl,
  createTiktokUrl,
  createWebsiteUrl,
} from "@/utils/socialMedia";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Linking, TouchableOpacity, View } from "react-native";

type StudioOverviewProps = {
  name?: string | null;
  logo?: string | null;
  ownerFirstName?: string | null;
  ownerLastName?: string | null;
  ownerId?: string | null;
  municipality?: string | null;
  province?: string | null;
  address?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  website?: string | null;
};

export default function StudioOverview({
  name,
  logo,
  ownerFirstName,
  ownerLastName,
  ownerId,
  municipality,
  province,
  address,
  instagram,
  tiktok,
  website,
}: StudioOverviewProps) {
  const router = useRouter();

  // Show only first name for owner label
  const ownerName = ownerFirstName || "";
  const studioName =
    name && name.length > 0
      ? name.charAt(0).toUpperCase() + name.slice(1)
      : "Studio";
  const isLongName = studioName.length > 18;

  const openUrl = (url?: string | null) => {
    if (!url) return;
    try {
      Linking.openURL(url);
    } catch (_) {}
  };

  const openMaps = () => {
    if (!municipality || !province) return;
    const url = buildGoogleMapsUrl(municipality, province, address);
    openUrl(url);
  };

  // Try to build a static map preview (uses Google Static Maps if key provided)
  const staticMapUrl = (() => {
    if (!municipality || !province) return undefined;
    // Use full address if available, otherwise fallback to municipality, province
    const mapQuery = address
      ? encodeURIComponent(`${address}, ${municipality}, ${province}`)
      : encodeURIComponent(`${municipality}, ${province}`);
    const size = `${Math.round(s(150))}x${Math.round(mvs(100))}`;
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY;
    // If key exists, build Google Static Maps URL; otherwise return undefined to fallback UI
    return key
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${mapQuery}&zoom=13&size=${size}&scale=2&maptype=roadmap&markers=color:red%7C${mapQuery}&key=${key}`
      : undefined;
  })();

  return (
    <View
      style={{
        paddingHorizontal: s(16),
        paddingTop: s(20),
        borderTopLeftRadius: s(35),
        borderTopRightRadius: s(35),
        marginTop: -mvs(52),
      }}
      className="bg-background"
    >
      {/* Top: Logo + Name */}
      <View
        style={{
          flexDirection: "row",
          alignItems: isLongName ? "flex-start" : "center",
          gap: s(12),
        }}
      >
        <View
          className="overflow-hidden border border-black rounded-full"
          style={{ width: s(92), height: s(92) }}
        >
          {logo ? (
            <Image
              source={{ uri: logo }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-gray/30" />
          )}
        </View>

        <View style={{ flex: 1, flexShrink: 1 }}>
          <ScaledText
            allowScaling={false}
            variant="2xl"
            className="leading-tight text-foreground font-neueBold"
            numberOfLines={isLongName ? 2 : 1}
          >
            {studioName}
          </ScaledText>
        </View>
      </View>

      {/* Bottom: two columns */}
      <View
        style={{
          marginTop: mvs(16),
          flexDirection: "row",
          alignItems: "stretch",
          gap: s(30),
        }}
      >
        {/* Left column */}
        <View style={{ flex: 1 }}>
        {!!ownerName && (
          <View
            style={{
              marginBottom: mvs(6),
              flexDirection: "row",
              alignItems: "flex-start",
              gap: s(6),
            }}
          >
            <View style={{ marginTop: mvs(2) }}>
              <SVGIcons.Studio style={{ width: s(14), height: s(14) }} />
            </View>
            <View style={{ flex: 1, flexShrink: 1 }}>
              {ownerName.length <= 18 ? (
                // Short owner name: keep label and name on the same line
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueLight"
                >
                  Di proprietà di{" "}
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueSemibold"
                    onPress={() => {
                      if (ownerId) {
                        router.push(`/user/${ownerId}` as any);
                      }
                    }}
                  >
                    {ownerName}
                  </ScaledText>
                </ScaledText>
              ) : (
                // Long owner name: move name to next line
                <>
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueLight"
                  >
                    Di proprietà di
                  </ScaledText>
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueSemibold"
                    style={{ marginTop: mvs(2) }}
                    onPress={() => {
                      if (ownerId) {
                        router.push(`/user/${ownerId}` as any);
                      }
                    }}
                  >
                    {ownerName}
                  </ScaledText>
                </>
              )}
            </View>
          </View>
        )}

          {(municipality || province || address) && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: mvs(10),
              }}
            >
              <View style={{ marginTop: mvs(2) }}>
                <SVGIcons.Location style={{ width: s(14), height: s(14) }} />
              </View>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueLight"
                style={{ marginLeft: s(6), flexShrink: 1 }}
              >
                {/* If we have a full address, show only that; otherwise fallback to "Comune (PROV)" */}
                {address
                  ? address
                  : `${municipality || ""}${
                      province ? ` (${province})` : ""
                    }`}
              </ScaledText>
            </View>
          )}

          {/* Socials */}
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}
          >
            {!!instagram && (
              <TouchableOpacity
                onPress={() => openUrl(createInstagramUrl(instagram))}
                activeOpacity={0.8}
              >
                <View
                  className="items-center justify-center"
                  style={{
                    width: s(41.5),
                    height: s(41.5),
                    backgroundColor: "#AE0E0E80",
                    borderRadius: s(100),
                  }}
                >
                  <SVGIcons.Instagram style={{ width: s(20), height: s(20) }} />
                </View>
              </TouchableOpacity>
            )}
            {!!tiktok && (
              <TouchableOpacity
                onPress={() => openUrl(createTiktokUrl(tiktok))}
                activeOpacity={0.8}
              >
                <View
                  className="items-center justify-center"
                  style={{
                    width: s(41.5),
                    height: s(41.5),
                    backgroundColor: "#25F4EE80",
                    borderRadius: s(100),
                  }}
                >
                  <SVGIcons.Tiktok style={{ width: s(20), height: s(20) }} />
                </View>
              </TouchableOpacity>
            )}
            {!!website && (
              <TouchableOpacity
                onPress={() => openUrl(createWebsiteUrl(website))}
                activeOpacity={0.8}
              >
                <View
                  className="items-center justify-center"
                  style={{
                    width: s(41.5),
                    height: s(41.5),
                    backgroundColor: "#70707080",
                    borderRadius: s(100),
                  }}
                >
                  <SVGIcons.Website style={{ width: s(20), height: s(20) }} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Right column: Map */}
        <TouchableOpacity onPress={openMaps} activeOpacity={0.85}>
          {staticMapUrl ? (
            <Image
              source={{ uri: staticMapUrl }}
              style={{
                width: s(150),
                height: mvs(95),
                borderRadius: s(12),
                borderWidth: s(0.5),
                borderColor: "#A49A99",
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: s(150),
                height: mvs(95),
                borderRadius: s(12),
                borderWidth: s(0.5),
                borderColor: "#A49A99",
                alignItems: "center",
                justifyContent: "center",
                gap: s(8),
              }}
            >
              <SVGIcons.Location style={{ width: s(24), height: s(24) }} />
              <ScaledText
                allowScaling={false}
                variant="11"
                className="text-foreground font-neueMedium"
              >
                Apri in Maps
              </ScaledText>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
