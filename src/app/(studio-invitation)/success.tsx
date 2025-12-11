import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

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

export default function StudioInvitationSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    studioName?: string;
    studioLogo?: string;
    senderName?: string;
    senderAvatar?: string;
    artistAvatar?: string;
  }>();

  const studioName = params.studioName || "Studio";
  const studioLogo = resolveImageUrl(params.studioLogo);
  const senderName = params.senderName || "";
  const senderAvatar = resolveImageUrl(params.senderAvatar);
  const artistAvatar = resolveImageUrl(params.artistAvatar);

  const handleDone = () => {
    router.replace("/settings/studio" as any);
  };

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        <View
          className="flex-1"
          style={{
            paddingHorizontal: s(24),
            paddingTop: mvs(100),
            paddingBottom: mvs(40),
            justifyContent: "space-between",
          }}
        >
          {/* Content Container - Centered */}
          <View className="items-center justify-center flex-1">
            {/* Overlapping Images Container */}
            <View
              className="relative items-center justify-center"
              style={{
                marginBottom: mvs(40),
                height: s(125),
                width: s(215), // Width to accommodate both images with overlap
              }}
            >
              {/* Artist Avatar (Left) */}
              <View
                className="absolute"
                style={{
                  left: s(0),
                  width: s(125),
                  height: s(125),
                  zIndex: 1,
                }}
              >
                {artistAvatar ? (
                  <Image
                    source={{ uri: artistAvatar }}
                    style={{
                      width: s(125),
                      height: s(125),
                      borderRadius: s(62.5),
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="items-center justify-center rounded-full bg-foreground/10"
                    style={{
                      width: s(125),
                      height: s(125),
                    }}
                  >
                    <SVGIcons.Studio width={s(60)} height={s(60)} />
                  </View>
                )}
              </View>

              {/* Studio Logo (Right, overlapping) */}
              <View
                className="absolute"
                style={{
                  left: s(90), // Overlaps by ~35px
                  width: s(125),
                  height: s(125),
                  zIndex: 2,
                }}
              >
                {studioLogo ? (
                  <Image
                    source={{ uri: studioLogo }}
                    style={{
                      width: s(125),
                      height: s(125),
                      borderRadius: s(62.5),
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="items-center justify-center rounded-full bg-foreground/10"
                    style={{
                      width: s(125),
                      height: s(125),
                    }}
                  >
                    <SVGIcons.Studio width={s(60)} height={s(60)} />
                  </View>
                )}
              </View>
            </View>

            {/* Congratulations Heading */}
            <ScaledText
              allowScaling={false}
              variant="xl"
              className="mb-4 text-center text-white font-neueSemibold"
              style={{
                fontSize: s(24),
                lineHeight: s(36),
                letterSpacing: s(-0.5),
              }}
            >
              Congratulations!
            </ScaledText>

            {/* Message Text */}
            <View
              className="items-center"
              style={{
                marginBottom: mvs(40),
                width: "100%",
                maxWidth: s(227),
              }}
            >
              <View className="flex-row flex-wrap items-center justify-center">
                <Text
                  style={{
                    fontSize: s(12),
                    lineHeight: s(17),
                    color: "#FFFFFF",
                    textAlign: "center",
                    fontFamily: "Montserrat_400Regular",
                  }}
                >
                  You've accepted the invitation to join{" "}
                  <Text
                    style={{
                      fontSize: s(12),
                      lineHeight: s(17),
                      fontFamily: "Montserrat_700Bold",
                    }}
                  >
                    {studioName}
                  </Text>{" "}
                  Studio by{" "}
                </Text>
                {senderAvatar ? (
                  <Image
                    source={{ uri: senderAvatar }}
                    style={{
                      width: s(19),
                      height: s(19),
                      borderRadius: s(9.5),
                      marginHorizontal: s(6),
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="items-center justify-center rounded-full bg-foreground/20"
                    style={{
                      width: s(19),
                      height: s(19),
                      marginHorizontal: s(6),
                    }}
                  >
                    <View
                      style={{
                        width: s(10),
                        height: s(10),
                        borderRadius: s(5),
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                  </View>
                )}
                <Text
                  style={{
                    fontSize: s(12),
                    lineHeight: s(17),
                    color: "#FFFFFF",
                    fontFamily: "Montserrat_400Regular",
                  }}
                >
                  {senderName}.
                </Text>
              </View>
            </View>
          </View>

          {/* Done Button - Fixed at bottom */}
          <View
            style={{
              width: "100%",
            }}
          >
            <TouchableOpacity
              onPress={handleDone}
              className="items-center justify-center rounded-full bg-primary"
              style={{
                width: "100%",
                maxWidth: s(350),
                paddingVertical: mvs(17),
                paddingHorizontal: s(16),
                alignSelf: "center",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-white font-neueSemibold"
                style={{
                  fontSize: s(14),
                  lineHeight: s(23),
                }}
              >
                Done
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
