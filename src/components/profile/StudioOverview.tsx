import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { buildGoogleMapsUrl } from "@/services/location.service";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { Image, Linking, TouchableOpacity, View } from "react-native";

type StudioOverviewProps = {
  name?: string | null;
  logo?: string | null;
  ownerFirstName?: string | null;
  ownerLastName?: string | null;
  municipality?: string | null;
  province?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  website?: string | null;
};

export default function StudioOverview({
  name,
  logo,
  ownerFirstName,
  ownerLastName,
  municipality,
  province,
  instagram,
  tiktok,
  website,
}: StudioOverviewProps) {
  const ownerName = [ownerFirstName, ownerLastName].filter(Boolean).join(" ");

  const openUrl = (url?: string | null) => {
    if (!url) return;
    try {
      Linking.openURL(url);
    } catch (_) {}
  };

  const openMaps = () => {
    if (!municipality || !province) return;
    const url = buildGoogleMapsUrl(municipality, province);
    openUrl(url);
  };

  // Try to build a static map preview (uses Google Static Maps if key provided)
  const staticMapUrl = (() => {
    if (!municipality || !province) return undefined;
    const address = encodeURIComponent(`${municipality}, ${province}`);
    const size = `${Math.round(s(150))}x${Math.round(mvs(100))}`;
    const key = (process as any).env?.EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY;
    // If key exists, build Google Static Maps URL; otherwise return undefined to fallback UI
    return key
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${address}&zoom=13&size=${size}&scale=2&maptype=roadmap&markers=color:red%7C${address}&key=${key}`
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: s(12) }}>
        <View
          className="rounded-full border border-black overflow-hidden"
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

        <ScaledText
          allowScaling={false}
          variant="2xl"
          className="text-foreground font-neueBold leading-tight"
        >
          {name || "Studio"}
        </ScaledText>
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
                alignItems: "center",
                gap: s(6),
              }}
            >
              <SVGIcons.Studio style={{ width: s(14), height: s(14) }} />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueLight"
                numberOfLines={1}
              >
                Owned by{" "}
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueBold"
                  numberOfLines={1}
                >
                  {ownerName}
                </ScaledText>
              </ScaledText>
            </View>
          )}

          {(municipality || province) && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: mvs(10),
              }}
            >
              <SVGIcons.Location style={{ width: s(14), height: s(14) }} />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueLight"
                style={{ marginLeft: s(6) }}
              >
                {municipality}
                {province ? ` (${province})` : ""}
              </ScaledText>
            </View>
          )}

          {/* Socials */}
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}
          >
            {!!instagram && (
              <TouchableOpacity
                onPress={() => openUrl(instagram)}
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
                onPress={() => openUrl(tiktok)}
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
                onPress={() => openUrl(website)}
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
