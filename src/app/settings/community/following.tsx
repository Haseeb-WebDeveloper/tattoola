import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchFollowingUsers, FollowingUser } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "artists" | "tattooLovers";

// Skeleton Card Component
const SkeletonCard: React.FC = () => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View
      className="bg-tat-foreground border-gray"
      style={{
        borderWidth: s(0.5),
        marginBottom: mvs(16),
        height: mvs(78),
        paddingHorizontal: s(14),
        paddingVertical: mvs(10),
        flexDirection: "row",
        alignItems: "center",
        borderRadius: s(12),
      }}
    >
      {/* Avatar Skeleton */}
      <Animated.View
        style={{
          width: s(57),
          height: s(57),
          borderRadius: s(57),
          backgroundColor: "#2A2A2A",
          marginRight: s(12),
          opacity,
        }}
      />

      {/* Content Skeleton */}
      <View style={{ flex: 1 }}>
        {/* Username skeleton */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: mvs(2) }}>
          <Animated.View
            style={{
              width: s(100),
              height: mvs(14),
              backgroundColor: "#2A2A2A",
              borderRadius: s(4),
              marginRight: s(4),
              opacity,
            }}
          />
          <Animated.View
            style={{
              width: s(17),
              height: s(17),
              backgroundColor: "#2A2A2A",
              borderRadius: s(17),
              opacity,
            }}
          />
        </View>

        {/* Full name skeleton */}
        <Animated.View
          style={{
            width: s(150),
            height: mvs(11),
            backgroundColor: "#2A2A2A",
            borderRadius: s(4),
            marginBottom: mvs(3),
            opacity,
          }}
        />

        {/* Location skeleton */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Animated.View
            style={{
              width: s(10),
              height: s(10),
              backgroundColor: "#2A2A2A",
              borderRadius: s(2),
              marginRight: s(2),
              opacity,
            }}
          />
          <Animated.View
            style={{
              width: s(80),
              height: mvs(11),
              backgroundColor: "#2A2A2A",
              borderRadius: s(4),
              opacity,
            }}
          />
        </View>
      </View>

      {/* Subscription Icon Skeleton */}
      <Animated.View
        style={{
          position: "absolute",
          top: mvs(7),
          right: s(14),
          width: s(14),
          height: s(14),
          backgroundColor: "#2A2A2A",
          borderRadius: s(7),
          opacity,
        }}
      />
    </View>
  );
};

interface UserCardProps {
  user: FollowingUser;
  onPress: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const location = user.location
    ? `${user.location.municipality || ""}${user.location.province ? ` (${user.location.province})` : ""}`
    : "";

  return (
    <TouchableOpacity
      onPress={() => onPress(user.id)}
      className="bg-tat-foreground border-gray"
      style={{
        borderWidth: s(0.5),
        marginBottom: mvs(16),
        height: mvs(78),
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
        {user.avatar ? (
          <Image
            source={{ uri: user.avatar }}
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

      {/* User Info */}
      <View style={{ flex: 1 }}>
        {/* Username with verification badge */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: mvs(2) }}>
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground font-montserratSemibold"
            style={{ marginRight: s(4), fontWeight: "600" }}
          >
            @{user.username}
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
      {user.subscriptionPlanType && (
        <View style={{ position: "absolute", top: mvs(7), right: s(14) }}>
          {user.subscriptionPlanType === "PREMIUM" ? (
            <SVGIcons.DimondYellow width={s(14)} height={s(14)} />
          ) : user.subscriptionPlanType === "STUDIO" ? (
            <SVGIcons.DimondRed width={s(14)} height={s(14)} />
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function FollowingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("artists");
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState<FollowingUser[]>([]);
  const [tattooLovers, setTattooLovers] = useState<FollowingUser[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const loadFollowing = async () => {
      try {
        setLoading(true);
        const data = await fetchFollowingUsers(user.id);
        setArtists(data.artists);
        setTattooLovers(data.tattooLovers);
      } catch (error) {
        console.error("Error fetching following:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowing();
  }, [user?.id]);

  const handleBack = () => {
    router.back();
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}` as any);
  };

  const displayedUsers = activeTab === "artists" ? artists : tattooLovers;

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-center relative"
          style={{
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
            marginBottom: mvs(24),
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            className="absolute rounded-full bg-foreground/20 items-center justify-center"
            style={{
              width: s(34),
              height: s(34),
              left: s(16),
              padding: s(8),
            }}
          >
            <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
          </TouchableOpacity>
          <ScaledText
            allowScaling={false}
            variant="body1"
            className="text-white font-neueSemibold"
          >
            Chi segui
          </ScaledText>
        </View>

        {/* Divider */}
        <View
          style={{
            height: s(1),
            backgroundColor: "#A49A99",
            marginHorizontal: s(32),
            marginBottom: mvs(16),
          }}
        />

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: s(16),
            marginBottom: mvs(24),
            gap: s(12),
          }}
        >
          {/* Artists Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab("artists")}
            style={{
              flex: 1,
              height: mvs(25),
              borderRadius: s(18),
              backgroundColor:
                activeTab === "artists" ? "#B31D1D" : "transparent",
              borderWidth: activeTab === "artists" ? 0 : s(1),
              borderColor: "#A49A99",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <SVGIcons.Pen1
              width={s(12)}
              height={s(12)}
              style={{ marginRight: s(4) }}
            />
            <ScaledText
              allowScaling={false}
              variant="body4"
              className="text-white"
            >
              Artisti che segui ({artists.length})
            </ScaledText>
          </TouchableOpacity>

          {/* Tattoo Lovers Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab("tattooLovers")}
            style={{
              flex: 1,
              height: mvs(25),
              borderRadius: s(18),
              backgroundColor:
                activeTab === "tattooLovers" ? "#B31D1D" : "transparent",
              borderWidth: activeTab === "tattooLovers" ? 0 : s(1),
              borderColor: "#A49A99",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <SVGIcons.UserFilled
              width={s(12)}
              height={s(12)}
              style={{ marginRight: s(4) }}
            />
            <ScaledText
              allowScaling={false}
              variant="body4"
              className="text-white"
            >
              Tattoo lovers che segui ({tattooLovers.length})
            </ScaledText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
          }}
        >
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : displayedUsers.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: mvs(32) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
                className="text-gray"
            >
                {activeTab === "artists"
                  ? "Non segui ancora nessun artista"
                  : "Non segui ancora nessun tattoo lover"}
            </ScaledText>
          </View>
          ) : (
            displayedUsers.map((user) => (
              <UserCard key={user.id} user={user} onPress={handleUserPress} />
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

