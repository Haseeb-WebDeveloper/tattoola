import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchArtistStudio } from "@/services/studio.service";
import { SubscriptionService } from "@/services/subscription.service";
import { StudioInfo } from "@/types/studio";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ImageBackground,
  Modal,
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
    activeOpacity={1}
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
      className={`font-neueSemibold text-white`}
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
      <View style={{ minHeight: mvs(120), position: "relative" }}>
        {/* Gradient overlay between image end and bottom space */}
        <LinearGradient
          colors={["rgba(16, 12, 12, 0)", "#100C0C"]}
          locations={[0, 1]}
          style={{
            position: "absolute",
            top: -mvs(60),
            bottom: 0,
            left: 0,
            right: 0,
          }}
        />
      </View>
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
        variant="xl"
        className="text-white font-neueSemibold"
      >
        Imposta la pagina del tuo Studio 🪄
      </ScaledText>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-neueLight"
        style={{
          marginBottom: mvs(14),
          width: "100%",
        }}
      >
        Aggiungi dettagli, foto e stile per costruire{"\n"}la presenza del tuo studio.
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
        className="text-white font-neueSemibold"
      >
        Inizia
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
      <View style={{ minHeight: mvs(100), position: "relative" }}>
        {/* Gradient overlay between image end and bottom space */}
        <LinearGradient
          colors={["rgba(16, 12, 12, 0)", "#100C0C"]}
          locations={[0, 1]}
          style={{
            position: "absolute",
            top: -mvs(60),
            bottom: 0,
            left: 0,
            right: 0,
          }}
        />
      </View>
    </View>
    {/* Absolute overlayed content (centered & bottom) */}
    <View
      style={{
        position: "absolute",
        left: s(0),
        right: s(0),
        top: mvs(100),
        paddingHorizontal: s(22),
        zIndex: 2,
      }}
    >
      <ScaledText
        allowScaling={false}
        variant="xl"
        className="text-white font-neueSemibold"

      >
        La tua pagina Studio è online ✨
      </ScaledText>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-neueLight"
        style={{
          marginBottom: mvs(14),
          width: "100%",
        }}
      >
        Scopri come appare il tuo profilo agli altri.
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
        className="text-white font-neueSemibold"
      >
        Vedi pagina Studio
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
  const [userPlanType, setUserPlanType] = useState<"PREMIUM" | "STUDIO" | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showNotOwnerModal, setShowNotOwnerModal] = useState(false);

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

  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user?.id || user?.role !== "ARTIST") return;
      
      try {
        const subscription = await SubscriptionService.getActiveSubscriptionWithPlan();
        if (subscription?.subscription_plans?.type) {
          setUserPlanType(subscription.subscription_plans.type);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchUserSubscription();
  }, [user]);

  const handleBack = () => {
    router.back();
  };

  const handleLockedFeature = () => {
    if (userPlanType === "PREMIUM") {
      setShowUpgradeModal(true);
    }
  };

  const handleStudioPagePress = () => {
    // Check if user is OWNER
    if (studio?.userRole !== "OWNER") {
      if (userPlanType === "PREMIUM") {
        setShowUpgradeModal(true);
      } else {
        setShowNotOwnerModal(true);
      }
      return;
    }
    router.push("/settings/studio/profile" as any);
  };

  const handleArtistsPress = () => {
    // Check if user is OWNER
    if (studio?.userRole !== "OWNER") {
      if (userPlanType === "PREMIUM") {
        setShowUpgradeModal(true);
      } else {
        setShowNotOwnerModal(true);
      }
      return;
    }
    router.push("/settings/studio/artists" as any);
  };

  const handlePhotosPress = () => {
    // Check if user is OWNER
    if (studio?.userRole !== "OWNER") {
      if (userPlanType === "PREMIUM") {
        setShowUpgradeModal(true);
      } else {
        setShowNotOwnerModal(true);
      }
      return;
    }
    router.push("/settings/studio/photos" as any);
  };

  const handleSetupPress = () => {
    // Check if user is OWNER
    if (studio?.userRole !== "OWNER") {
      if (userPlanType === "PREMIUM") {
        setShowUpgradeModal(true);
      } else {
        setShowNotOwnerModal(true);
      }
      return;
    }
    router.push("/settings/studio/step-0" as any);
  };
  
  const handleStudioPageViewPress = (id: string | undefined) => {
    // Viewing studio page is allowed for everyone, but editing requires OWNER
    if (!id) {
      if (studio?.userRole !== "OWNER") {
        if (userPlanType === "PREMIUM") {
          setShowUpgradeModal(true);
        } else {
          setShowNotOwnerModal(true);
        }
        return;
      }
      router.push("/settings/studio/profile" as any);
      return;
    }
    router.push(`/studio/${id}` as any);
  };

  const handleUpgradePress = () => {
    setShowUpgradeModal(false);
    router.push("/settings/subscription" as any);
  };

  const showSetupCard =
    !loading &&
    userPlanType === "STUDIO" &&
    (!studio ||
      (!studio.isCompleted && studio.userRole === "OWNER"));

  const showStudioItems = !loading && studio;
  
  const showPremiumMessage = !loading && !studio && userPlanType === "PREMIUM";

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          className="relative flex-row items-center justify-center"
          style={{
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
            marginBottom: mvs(24),
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            className="absolute items-center justify-center rounded-full bg-foreground/20"
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
              className="text-white font-neueSemibold"
            >
              Studio
            </ScaledText>
            <SVGIcons.DimondRed width={s(20)} height={s(20)} />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: mvs(32) }}
        >
          <View
            style={{
              marginBottom: mvs(32),
            }}
          >
            <StudioSettingsItem
              title="Pagina studio"
              onPress={handleStudioPagePress}
            />
            {/* Show all items to everyone, but only OWNER can edit */}
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
          ) : showPremiumMessage ? (
            <View
              style={{
                marginHorizontal: s(16),
                marginTop: mvs(10),
                marginBottom: mvs(24),
                borderRadius: s(20),
                padding: s(24),
                borderWidth: s(1),
                borderColor: "#a49a99",
              }}
              className="bg-tat-darkMaroon"
            >
              <View className="items-center" style={{ marginBottom: mvs(12) }}>
                <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
              </View>
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-center text-foreground font-neueBold"
                style={{ marginBottom: mvs(8) }}
              >
                Funzionalità Studio bloccate
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-center text-gray font-neueMedium"
                style={{ marginBottom: mvs(16) }}
              >
                Non hai un piano STUDIO. Abbonati al piano Studio per avere accesso alle funzionalità Studio.
              </ScaledText>
              <TouchableOpacity
                onPress={handleUpgradePress}
                activeOpacity={0.85}
                style={{
                  borderRadius: s(100),
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: mvs(10.5),
                  paddingHorizontal: s(20),
                }}
                className="bg-primary"
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-white font-neueSemibold"
                >
                  Passa al piano Studio
                </ScaledText>
              </TouchableOpacity>
            </View>
          ) : (
            <LiveCard onPress={() => handleStudioPageViewPress(studio?.id)} />
          )}
          {/* handleStudioPagePress */}
        </ScrollView>
      </LinearGradient>

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View
          className="items-center justify-center flex-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: s(342),
              paddingHorizontal: s(24),
              paddingVertical: mvs(32),
            }}
          >
            <View className="items-center" style={{ marginBottom: mvs(16) }}>
              <SVGIcons.WarningYellow width={s(28)} height={s(28)} />
            </View>

            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-center text-background font-neueBold"
              style={{ marginBottom: mvs(4) }}
            >
              Funzionalità Studio bloccate
            </ScaledText>

            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-center text-background font-montserratMedium"
              style={{ marginBottom: mvs(32) }}
            >
              Non hai un piano STUDIO. Abbonati al piano Studio per avere accesso alle funzionalità Studio.
            </ScaledText>

            <View style={{ gap: mvs(4) }} className="flex-row justify-center">
              <TouchableOpacity
                onPress={handleUpgradePress}
                className="flex-row items-center justify-center rounded-full"
                style={{
                  backgroundColor: "#AE0E0E",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="font-montserratMedium text-foreground"
                >
                  Passa al piano Studio
                </ScaledText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowUpgradeModal(false)}
                className="items-center justify-center rounded-full"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratMedium"
                >
                  Annulla
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Not Owner Modal */}
      <Modal
        visible={showNotOwnerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotOwnerModal(false)}
      >
        <View
          className="items-center justify-center flex-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: s(342),
              paddingHorizontal: s(24),
              paddingVertical: mvs(32),
            }}
          >
            <View className="items-center" style={{ marginBottom: mvs(16) }}>
              <SVGIcons.WarningYellow width={s(28)} height={s(28)} />
            </View>

            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-center text-background font-neueBold"
              style={{ marginBottom: mvs(4) }}
            >
              Accesso negato
            </ScaledText>

            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-center text-background font-montserratMedium"
              style={{ marginBottom: mvs(32) }}
            >
              Solo il proprietario dello Studio può modificare queste impostazioni.
            </ScaledText>

            <TouchableOpacity
              onPress={() => setShowNotOwnerModal(false)}
              className="items-center justify-center rounded-full"
              style={{
                backgroundColor: "#AE0E0E",
                paddingVertical: mvs(10.5),
                paddingHorizontal: s(20),
                width: "100%",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="font-montserratMedium text-foreground"
              >
                Chiudi
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
