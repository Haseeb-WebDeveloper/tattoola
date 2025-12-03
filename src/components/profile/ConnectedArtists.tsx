import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

interface ArtistStyle {
  id: string;
  name: string;
  imageUrl?: string | null;
}

interface ArtistBanner {
  mediaUrl: string;
  mediaType: string;
  order: number;
}

interface ConnectedArtist {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  experienceYears?: number;
  location?: {
    municipality?: { name: string };
    province?: { name: string };
  } | null;
  styles: ArtistStyle[];
  ownedStudio?: { id: string; name: string } | null;
  banner: ArtistBanner[];
  role: string;
}

interface ConnectedArtistsProps {
  artists: ConnectedArtist[];
  studioName?: string;
}

export const ConnectedArtists: React.FC<ConnectedArtistsProps> = ({
  artists,
  studioName,
}) => {
  if (!artists || artists.length === 0) {
    return null;
  }

  const handleArtistPress = (userId: string) => {
    router.push(`/user/${userId}` as any);
  };

  const handleFollowPress = (userId: string) => {
    // TODO: Implement follow functionality
    // console.log("Follow artist:", userId);
  };

  const handleGreetPress = (userId: string) => {
    // TODO: Implement greet/message functionality
    // console.log("Greet artist:", userId);
  };

  return (
    <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-montserratSemibold"
        style={{ marginBottom: mvs(12) }}
      >
        Artisti collegati allo studio
      </ScaledText>

      <View style={{ gap: mvs(16) }}>
        {artists.map((artist) => {
          const fullName = `${artist.firstName || ""} ${artist.lastName || ""}`.trim();
          const location = artist.location
            ? `${artist.location.municipality?.name || ""}, ${artist.location.province?.name || ""}`.replace(/^,\s*|,\s*$/g, "")
            : "";
          
          const bannerLeft = artist.banner[0];
          const bannerRight = artist.banner[1];

          return (
            <View
              key={artist.id}
              className="overflow-hidden"
              style={{
                width: s(362),
                height: mvs(344),
                borderRadius: s(35),
                backgroundColor: "#0a0101",
                borderWidth: 0.5,
                borderColor: "#a49a99",
              }}
            >
              {/* Top section with avatar and info */}
              <View style={{ paddingHorizontal: s(16), paddingTop: mvs(16) }}>
                {/* Studio profile badge */}
                {artist.ownedStudio && (
                  <View
                    className="absolute right-0 top-0 flex-row items-center"
                    style={{
                      backgroundColor: "#a49a99",
                      paddingHorizontal: s(8),
                      paddingVertical: mvs(3),
                      borderTopRightRadius: s(35),
                      borderBottomLeftRadius: s(9),
                      gap: s(4),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-red font-neueRoman"
                    >
                      Profilo studio
                    </ScaledText>
                  </View>
                )}

                {/* Artist info */}
                <TouchableOpacity
                  onPress={() => handleArtistPress(artist.userId)}
                  className="flex-row items-start"
                  style={{ gap: s(12) }}
                >
                  {/* Avatar */}
                  {artist.avatar ? (
                    <Image
                      source={{ uri: artist.avatar }}
                      style={{
                        width: s(58),
                        height: s(58),
                        borderRadius: s(58),
                        borderWidth: 1,
                        borderColor: "#000",
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: s(58),
                        height: s(58),
                        borderRadius: s(58),
                        backgroundColor: "#333",
                      }}
                    />
                  )}

                  {/* Info */}
                  <View className="flex-1">
                    <View className="flex-row items-center" style={{ gap: s(4) }}>
                      <ScaledText
                        allowScaling={false}
                        variant="lg"
                        className="text-white font-neueBold"
                      >
                        {fullName}
                      </ScaledText>
                      <SVGIcons.VarifiedGreen style={{ width: s(16), height: s(16) }} />
                    </View>

                    {/* Experience */}
                    {artist.experienceYears !== undefined && (
                      <View className="flex-row items-center" style={{ marginTop: mvs(3), gap: s(4) }}>
                        <SVGIcons.Star style={{ width: s(14), height: s(14) }} />
                        <ScaledText
                          allowScaling={false}
                          variant="md"
                          className="text-white font-neueLight"
                        >
                          {artist.experienceYears} anni di esperienza
                        </ScaledText>
                      </View>
                    )}

                    {/* Studio ownership */}
                    {artist.ownedStudio && (
                      <View className="flex-row items-center" style={{ marginTop: mvs(3), gap: s(4) }}>
                        <SVGIcons.Studio style={{ width: s(14), height: s(14) }} />
                        <ScaledText
                          allowScaling={false}
                          variant="md"
                          className="text-white font-neueLight"
                        >
                          Titolare di{" "}
                          <ScaledText
                            allowScaling={false}
                            variant="md"
                            className="text-white font-neueBold"
                          >
                            {artist.ownedStudio.name}
                          </ScaledText>
                        </ScaledText>
                      </View>
                    )}

                    {/* Location */}
                    {location && (
                      <View className="flex-row items-center" style={{ marginTop: mvs(3), gap: s(4) }}>
                        <SVGIcons.Location style={{ width: s(14), height: s(14) }} />
                        <ScaledText
                          allowScaling={false}
                          variant="md"
                          className="text-white font-neueLight"
                        >
                          {location}
                        </ScaledText>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Styles */}
                {artist.styles.length > 0 && (
                  <View className="flex-row flex-wrap" style={{ marginTop: mvs(12), gap: s(8) }}>
                    {artist.styles.map((style) => (
                      <View
                        key={style.id}
                        className="rounded-full border border-white"
                        style={{
                          paddingHorizontal: s(10),
                          paddingVertical: mvs(2),
                        }}
                      >
                        <ScaledText
                          allowScaling={false}
                          variant="sm"
                          className="text-white font-neueBold"
                        >
                          {style.name}
                        </ScaledText>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Bottom banner images */}
              <View
                className="absolute bottom-0 left-0 right-0 flex-row"
                style={{ height: mvs(131) }}
              >
                {bannerLeft && (
                  <Image
                    source={{ uri: bannerLeft.mediaUrl }}
                    style={{
                      width: s(174),
                      height: mvs(131),
                      borderBottomLeftRadius: s(35),
                    }}
                    resizeMode="cover"
                  />
                )}
                {bannerRight && (
                  <Image
                    source={{ uri: bannerRight.mediaUrl }}
                    style={{
                      flex: 1,
                      height: mvs(131),
                      borderBottomRightRadius: s(35),
                    }}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

