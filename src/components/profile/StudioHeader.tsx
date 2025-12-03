import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { Image, View } from "react-native";

interface StudioHeaderProps {
  name?: string;
  logo?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  city?: string;
  country?: string;
  mapImageUrl?: string;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  name,
  logo,
  ownerFirstName,
  ownerLastName,
  city,
  country,
  mapImageUrl,
}) => {
  const ownerName = `${ownerFirstName || ""} ${ownerLastName || ""}`.trim();
  const location = `${city || ""}, ${country || ""}`.replace(/^,\s*|,\s*$/g, "");

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
      <View className="flex-row items-start justify-between">
        {/* Left side: Logo and Studio Info */}
        <View className="flex-row flex-1" style={{ gap: s(12) }}>
          {logo ? (
            <Image
              source={{ uri: logo }}
              className="rounded-full"
              style={{ width: s(92), height: s(92) }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="rounded-full bg-gray/30"
              style={{ width: s(92), height: s(92) }}
            />
          )}
          
          <View className="flex-1">
            <ScaledText
              allowScaling={false}
              variant="2xl"
              className="text-foreground font-neueBold leading-tight"
            >
              {name || ""}
            </ScaledText>
            
            {/* Owner info */}
            {ownerName && (
              <View className="flex-row items-center" style={{ marginTop: mvs(3) }}>
                <View style={{ marginRight: s(4) }}>
                  <SVGIcons.Studio style={{ width: s(14), height: s(14) }} />
                </View>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueLight"
                >
                  Di proprietà di{" "}
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueBold"
                  >
                    {ownerName}
                  </ScaledText>
                </ScaledText>
              </View>
            )}

            {/* Location */}
            {location && (
              <View className="flex-row items-center" style={{ marginTop: mvs(3) }}>
                <View style={{ marginRight: s(4) }}>
                  <SVGIcons.Location style={{ width: s(14), height: s(14) }} />
                </View>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueLight"
                >
                  {location}
                </ScaledText>
              </View>
            )}
          </View>
        </View>

        {/* Right side: Map thumbnail */}
        {mapImageUrl && (
          <Image
            source={{ uri: mapImageUrl }}
            style={{
              width: s(68),
              height: s(68),
              borderRadius: s(6),
              marginLeft: s(8),
            }}
            resizeMode="cover"
          />
        )}
      </View>
    </View>
  );
};

