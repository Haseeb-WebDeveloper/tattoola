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
      marginTop: mvs(10),
      marginBottom: mvs(24),
      borderRadius: s(20),
      overflow: "hidden",
      borderWidth: s(0.5),
      borderColor: "#FFFFFF",
      backgroundColor: "#191516", // subtle bg under image edges
      // minHeight: mvs(325),
      position: "relative",
    }}
  >
    <View style={{ flexDirection: "column" }}>
      {/* Top row: image */}
      <ImageBackground
        source={require("@/assets/images/studio-start.png")}
        style={{
          width: "100%",
          minHeight: mvs(143),
          // aspectRatio: 16 / 9,
          justifyContent: "flex-start",
        }}
        resizeMode="cover"
        imageStyle={{ borderTopLeftRadius: s(20), borderTopRightRadius: s(20) }}
      >
        <LinearGradient
          colors={["rgba(17,17,17,0)", "rgba(17,17,17,0.75)"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderTopLeftRadius: s(20),
            borderTopRightRadius: s(20),
          }}
        />
        {/* Empty: strictly image area */}
      </ImageBackground>

      {/* Bottom row: for spacing - just to create space for abs content */}
      <View style={{ minHeight: mvs(120) }} />
    </View>
    {/* Absolute overlayed content (centered & bottom) */}
    <View
      style={{
        position: "absolute",
        left: s(0),
        right: s(0),
        top: mvs(100),
        paddingHorizontal: s(24),
        zIndex: 2,
      }}
    >
      <ScaledText
        allowScaling={false}
        variant="2xl"
        className="text-white font-semibold"
        style={{
          marginBottom: mvs(6),
        }}
      >
        Setup your Studio Page 🪄
      </ScaledText>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-light"
        style={{
          marginBottom: mvs(14),
          width: "100%",
        }}
      >
        Add details, photos, and style to build{"\n"}your studio’s presence.
      </ScaledText>
    </View>
    {/* Button absolute near the bottom */}
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        position: "absolute",
        left: s(20),
        right: s(20),
        bottom: mvs(20),
        borderRadius: s(100),
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: mvs(10.5),
        paddingLeft: s(18),
        paddingRight: s(20),
        elevation: 2,
        shadowColor: "#CA2323",
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
      className="bg-primary"
    >
      <ScaledText
        allowScaling={false}
        variant="md"
        className="font-semibold text-white"
      >
        Get started
      </ScaledText>
    </TouchableOpacity>
  </View>
);

const LiveCard: React.FC<SetupCardProps> = ({ onPress }) => (
  <View
    style={{
      marginHorizontal: s(16),
      marginTop: mvs(10),
      marginBottom: mvs(24),
      borderRadius: s(20),
      overflow: "hidden",
      borderWidth: s(0.5),
      borderColor: "#FFFFFF",
      backgroundColor: "#191516", // subtle bg under image edges
      // minHeight: mvs(325),
      position: "relative",
    }}
  >
    <View style={{ flexDirection: "column" }}>
      {/* Top row: image */}
      <ImageBackground
        source={require("@/assets/images/studio-live.png")}
        style={{
          width: "100%",
          minHeight: mvs(143),
          // aspectRatio: 16 / 9,
          justifyContent: "flex-start",
        }}
        resizeMode="cover"
        imageStyle={{ borderTopLeftRadius: s(20), borderTopRightRadius: s(20) }}
      >
        <LinearGradient
          colors={["rgba(17,17,17,0)", "rgba(17,17,17,0.75)"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderTopLeftRadius: s(20),
            borderTopRightRadius: s(20),
          }}
        />
        {/* Empty: strictly image area */}
      </ImageBackground>

      {/* Bottom row: for spacing - just to create space for abs content */}
      <View style={{ minHeight: mvs(120) }} />
    </View>
    {/* Absolute overlayed content (centered & bottom) */}
    <View
      style={{
        position: "absolute",
        left: s(0),
        right: s(0),
        top: mvs(100),
        paddingHorizontal: s(24),
        zIndex: 2,
      }}
    >
      <ScaledText
        allowScaling={false}
        variant="2xl"
        className="text-white font-semibold"
        style={{
          marginBottom: mvs(6),
        }}
      >
        Your Studio Page is Live ✨
      </ScaledText>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-light"
        style={{
          marginBottom: mvs(14),
          width: "100%",
        }}
      >
        See how your profile looks to others.
      </ScaledText>
    </View>
    {/* Button absolute near the bottom */}
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        position: "absolute",
        left: s(20),
        right: s(20),
        bottom: mvs(20),
        borderRadius: s(100),
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: mvs(10.5),
        paddingLeft: s(18),
        paddingRight: s(20),
        elevation: 2,
        shadowColor: "#CA2323",
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
      className="bg-primary"
    >
      <ScaledText
        allowScaling={false}
        variant="md"
        className="font-semibold text-white"
      >
        View Studio Page
      </ScaledText>
    </TouchableOpacity>
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
    router.push("/settings/studio/step-0" as any);
  };
  const handleStudioPageViewPress = (id: string | undefined) => {
    console.log('🎯 Navigating to studio page with ID:', id);
    if (!id) {
      console.log('⚠️ No studio ID, redirecting to profile');
      router.push("/settings/studio/profile" as any);
      return;
    }
    console.log('✅ Navigating to studio:', id);
    router.push(`/studio/${id}` as any);
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
          <View className="flex-row items-center gap-2">
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-white font-bold"
            >
              Studio
            </ScaledText>
            <SVGIcons.DimondRed width={s(20)} height={s(20)} />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: mvs(32) }}
        >
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
          {/* Setup Card - Show when no studio OR incomplete studio for OWNER/MANAGER */}
          {showSetupCard ? (
            <SetupCard onPress={handleSetupPress} />
          ) : (
            <LiveCard onPress={() => handleStudioPageViewPress(studio?.id)} />
          )}
          {/* handleStudioPagePress */}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
