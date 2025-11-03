import ScaledText from "@/components/ui/ScaledText";
import { FollowingUser } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";
import { ArtistCard } from "./ArtistCard";

interface FollowedArtistsListProps {
  artists: FollowingUser[];
}

export const FollowedArtistsList: React.FC<FollowedArtistsListProps> = ({ artists }) => {
  if (artists.length === 0) {
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: mvs(40),
          paddingHorizontal: s(16),
          minHeight: mvs(253),
        }}
        className="bg-tat-foreground"
      >
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-gray text-center font-neueLight"
        >
          Non segui ancora nessun artista
        </ScaledText>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: s(16), paddingTop: mvs(16) }} className="bg-tat-foreground">
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </View>
  );
};

