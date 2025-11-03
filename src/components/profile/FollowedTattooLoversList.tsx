import ScaledText from "@/components/ui/ScaledText";
import { FollowingUser } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";
import { ArtistCard } from "./ArtistCard";

interface FollowedTattooLoversListProps {
  tattooLovers: FollowingUser[];
}

export const FollowedTattooLoversList: React.FC<FollowedTattooLoversListProps> = ({ tattooLovers }) => {
  if (tattooLovers.length === 0) {
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
          Non segui ancora nessun tattoo lover
        </ScaledText>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: s(16), paddingTop: mvs(16) }} className="bg-tat-foreground">
      {tattooLovers.map((tattooLover) => (
        <ArtistCard key={tattooLover.id} artist={tattooLover} />
      ))}
    </View>
  );
};

