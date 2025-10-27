import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchArtistStudio } from "@/services/studio.service";
import { StudioInfo } from "@/types/studio";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

interface StudioSettingsItemProps {
  title: string;
  onPress: () => void;
}

const StudioSettingsItem: React.FC<StudioSettingsItemProps> = ({
  title,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between bg-[#100C0C] border-gray"
    style={{
      paddingVertical: mvs(16),
      paddingHorizontal: s(16),
      borderBottomWidth: s(0.5),
    }}
  >
    <ScaledText
      allowScaling={false}
      variant="md"
      className={`font-semibold text-white`}
    >
      {title}
    </ScaledText>
    <SVGIcons.ChevronRight width={s(10)} height={s(10)} />
  </TouchableOpacity>
);

interface SetupCardProps {
  onPress: () => void;
}

const SetupCard: React.FC<SetupCardProps> = ({ onPress }) => (
  <View
    style={{
      marginHorizontal: s(16),
      marginBottom: mvs(24),
      borderRadius: s(20),
      overflow: "hidden",
      borderWidth: s(0.5),
      borderColor: "#FFFFFF",
    }}
  >
    <ImageBackground
      source={require("@/assets/auth/welcome-screen.jpg")}
      style={{
        width: "100%",
        paddingHorizontal: s(24),
        paddingVertical: mvs(32),
      }}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(17,17,17,0)", "rgba(17,17,17,0.8)"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <View style={{ zIndex: 1 }}>
        <ScaledText
          allowScaling={false}
          variant="2xl"
          className="text-white font-bold"
          style={{ marginBottom: mvs(12) }}
        >
          Setup your Studio Page ✨
        </ScaledText>
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-white font-light"
          style={{ marginBottom: mvs(24), lineHeight: mvs(22) }}
        >
          Add details, photos, and style to build your studio's presence.
        </ScaledText>
        <TouchableOpacity
          onPress={onPress}
          className="bg-primary rounded-full items-center justify-center"
          style={{
            paddingVertical: mvs(14),
            paddingHorizontal: s(32),
          }}
        >
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-white font-bold"
          >
            Get started
          </ScaledText>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  </View>
);

// Skeleton Loader Component
const SkeletonLoader: React.FC = () => {
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
    <View style={{ paddingHorizontal: s(16) }}>
      <Animated.View
        style={{
          height: mvs(60),
          backgroundColor: "#2A2A2A",
          marginBottom: mvs(12),
          borderRadius: s(8),
          opacity,
        }}
      />
      <Animated.View
        style={{
          height: mvs(60),
          backgroundColor: "#2A2A2A",
          marginBottom: mvs(12),
          borderRadius: s(8),
          opacity,
        }}
      />
      <Animated.View
        style={{
          height: mvs(60),
          backgroundColor: "#2A2A2A",
          borderRadius: s(8),
          opacity,
        }}
      />
    </View>
  );
};

export default function StudioSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studio, setStudio] = useState<StudioInfo | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadStudio = async () => {
      try {
        setLoading(true);
        const studioData = await fetchArtistStudio(user.id);
        setStudio(studioData);
      } catch (error) {
        console.error("Error loading studio:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStudio();
  }, [user?.id]);

  const handleBack = () => {
    router.back();
  };

  const handleStudioPagePress = () => {
    router.push("/settings/studio/profile" as any);
  };

  const handleArtistsPress = () => {
    router.push("/settings/studio/artists" as any);
  };

  const handlePhotosPress = () => {
    router.push("/settings/studio/photos" as any);
  };

  const handleSetupPress = () => {
    router.push("/settings/studio/step-1" as any);
  };

  const showSetupCard =
    !loading &&
    (!studio ||
      (!studio.isCompleted &&
        (studio.userRole === "OWNER" || studio.userRole === "MANAGER")));

  const showStudioItems = !loading && studio;

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
            variant="lg"
            className="text-white font-bold"
          >
            Studio
          </ScaledText>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: mvs(32) }}
        >
          {loading ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* Studio Settings Items - Only visible when studio exists */}
              {showStudioItems && (
                <View
                style={{
                  marginBottom: mvs(32),
                }}
                >
                  <StudioSettingsItem
                    title="Studio page"
                    onPress={handleStudioPagePress}
                  />
                  <StudioSettingsItem
                    title="Artisti Collegati"
                    onPress={handleArtistsPress}
                  />
                  <StudioSettingsItem
                    title="Foto dello studio"
                    onPress={handlePhotosPress}
                  />
                </View>
              )}

              {/* Setup Card - Show when no studio OR incomplete studio for OWNER/MANAGER */}
              {showSetupCard && <SetupCard onPress={handleSetupPress} />}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
