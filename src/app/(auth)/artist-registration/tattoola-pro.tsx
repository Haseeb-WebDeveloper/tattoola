import ScaledText from "@/components/ui/ScaledText";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import ProScreenBackIcon from "@/assets/icons/proScreen-backicon.svg";
import {
  SubscriptionPlan,
  SubscriptionService,
} from "@/services/subscription.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { toast } from "sonner-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function TattoolaProScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const plansSectionRef = useRef<View>(null);
  const [plansSectionY, setPlansSectionY] = React.useState(0);
  const [expandedFaqs, setExpandedFaqs] = React.useState<
    Record<number, boolean>
  >({});
  const [billingCycle, setBillingCycle] = React.useState<"MONTHLY" | "YEARLY">(
    "MONTHLY"
  );
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = React.useState(false);
  const { updateStep13 } = useArtistRegistrationV2Store();

  // Fetch plans on mount
  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const fetchedPlans = await SubscriptionService.fetchSubscriptionPlans();
        setPlans(fetchedPlans);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const scrollToPlans = () => {
    if (plansSectionY > 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: plansSectionY - 50,
        animated: true,
      });
    } else {
      // Fallback: try to measure if Y not set yet
      setTimeout(() => {
        if (plansSectionRef.current) {
          plansSectionRef.current.measureInWindow((x, y, width, height) => {
            // Get the scroll view's content offset
            // For now, use the window Y position as approximation
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 100),
              animated: true,
            });
          });
        }
      }, 100);
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handlePlanSelection = async (
    planType: "premium" | "studio",
    action: "trial" | "buy" | "studio"
  ) => {
    try {
      // Find the plan based on type
      const plan = plans.find((p) => {
        const planName = (p.name || "").toLowerCase();
        if (planType === "premium") {
          return planName.includes("premium");
        } else {
          return planName.includes("studio");
        }
      });

      if (!plan) {
        toast.error("Plan not found");
        return;
      }

      // Store plan data in step13 with selected billing cycle
      updateStep13({
        selectedPlanId: plan.id,
        billingCycle: billingCycle,
      });

      // Navigate to artist registration step 1
      router.push("/(auth)/artist-register");
    } catch (error) {
      toast.error("Failed to load plans");
    }
  };

  // Get plan prices based on billing cycle
  const getPremiumPlan = () =>
    plans.find((p) => (p.name || "").toLowerCase().includes("premium"));
  const getStudioPlan = () =>
    plans.find((p) => (p.name || "").toLowerCase().includes("studio"));

  const premiumPlan = getPremiumPlan();
  const studioPlan = getStudioPlan();

  const premiumPrice =
    billingCycle === "MONTHLY"
      ? premiumPlan?.monthlyPrice || 19
      : premiumPlan?.yearlyPrice || 228;
  const studioPrice =
    billingCycle === "MONTHLY"
      ? studioPlan?.monthlyPrice || 59
      : studioPlan?.yearlyPrice || 708;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ProScreenBackIcon width={s(32)} height={s(32)} />
          </TouchableOpacity>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/logo/tattoola-dark.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <ScaledText
              variant="lg"
              allowScaling={false}
              className="text-primary font-neueMedium"
              style={styles.proText}
            >
              pro.
            </ScaledText>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ScaledText
            variant="2xl"
            allowScaling={false}
            className="text-center text-black font-neueMedium"
            style={styles.heroTitle}
          >
            Aiutiamo i tattoo artist a farsi conoscere e attrarre più clienti.
          </ScaledText>

          {/* Three Grid Images */}
          <View style={styles.imageGrid}>
            <Image
              source={require("@/assets/images/TattoolaProImage1.png")}
              style={[styles.gridImage, styles.gridImage1]}
              resizeMode="cover"
            />
            <Image
              source={require("@/assets/images/TattoolaProImage2.png")}
              style={[styles.gridImage, styles.gridImage2]}
              resizeMode="cover"
            />
            <Image
              source={require("@/assets/images/TattoolaProImage3.png")}
              style={[styles.gridImage, styles.gridImage3]}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <ScaledText
            variant="xl"
            allowScaling={false}
            className="text-center text-black font-neueMedium"
            style={styles.ctaQuestion}
          >
            Sei un Tattoo Artist?
          </ScaledText>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={scrollToPlans}
            activeOpacity={0.8}
          >
            <ScaledText
              variant="lg"
              allowScaling={false}
              className="text-white font-neueMedium"
            >
              Iscriviti
            </ScaledText>
          </TouchableOpacity>
        </View>

        {/* Community Section */}
        <View style={styles.communitySection}>
          <ScaledText
            variant="xl"
            allowScaling={false}
            className="text-center text-black font-neueBold"
            style={styles.communityText}
          >
            Tattoola è la prima community in Italia pensata per gli amanti dei
            tatuaggi
          </ScaledText>
        </View>

        {/* Steps Section */}
        {/* Step 1 */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <ScaledText
              variant="6xl"
              allowScaling={false}
              className="text-gray font-neueMedium"
              style={styles.stepNumber}
            >
              1
            </ScaledText>
            <ScaledText
              variant="xl"
              allowScaling={false}
              className="text-[#D9D9D9] font-neueMedium"
              style={styles.stepTitle}
            >
              Puoi gestire la tua pagina
            </ScaledText>
          </View>
          <View style={styles.stepImageContainer}>
            <Image
              source={require("@/assets/images/TattoolaProStep1.png")}
              style={styles.stepImage}
              resizeMode="contain"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0)", "#000000"]}
              style={styles.stepGradient}
              pointerEvents="none"
            />
          </View>
          <ScaledText
            variant="lg"
            allowScaling={false}
            className="text-[#D9D9D9] font-neueMedium"
            style={styles.stepDescription}
          >
            Ottieni la tua pagina personale ricercabile per Provincia e Comune.
          </ScaledText>
        </View>

        {/* Step 2 */}
        <View style={[styles.stepSection, styles.stepSection2]}>
          <View style={styles.stepHeader}>
            <ScaledText
              variant="6xl"
              allowScaling={false}
              className="text-gray font-neueMedium"
              style={styles.stepNumber}
            >
              2
            </ScaledText>
            <ScaledText
              variant="xl"
              allowScaling={false}
              className="text-[#D9D9D9] font-neueMedium"
              style={styles.stepTitle}
            >
              Puoi mostrare i tuoi lavori
            </ScaledText>
          </View>
          <View style={styles.stepImageContainer}>
            <Image
              source={require("@/assets/images/TattoolaProStep2.png")}
              style={styles.stepImage}
              resizeMode="contain"
            />
            <LinearGradient
              colors={["rgba(26,26,27,0)", "#1a1a1b"]}
              style={styles.stepGradient}
              pointerEvents="none"
            />
          </View>
          <ScaledText
            variant="lg"
            allowScaling={false}
            className="text-[#D9D9D9] font-neueMedium"
            style={styles.stepDescription}
          >
            Puoi inserire e organizzare i tuoi lavori con foto e video.
          </ScaledText>
        </View>

        {/* Step 3 */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <ScaledText
              variant="6xl"
              allowScaling={false}
              className="text-gray font-neueMedium"
              style={styles.stepNumber}
            >
              3
            </ScaledText>
            <ScaledText
              variant="xl"
              allowScaling={false}
              className="text-[#D9D9D9] font-neueMedium"
              style={styles.stepTitle}
            >
              Puoi ricevere nuove richieste
            </ScaledText>
          </View>
          <View style={styles.stepImageContainer}>
            <Image
              source={require("@/assets/images/TattoolaProStep3.png")}
              style={styles.stepImage}
              resizeMode="contain"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0)", "#000000"]}
              style={styles.stepGradient}
              pointerEvents="none"
            />
          </View>
          <ScaledText
            variant="lg"
            allowScaling={false}
            className="text-[#D9D9D9] font-neueMedium"
            style={styles.stepDescription}
          >
            Puoi essere contattato direttamente dalla tua pagina.
          </ScaledText>
        </View>

        {/* Plans Section */}
        <View
          ref={plansSectionRef}
          style={styles.plansSection}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            // Store the Y position relative to the ScrollView content
            setPlansSectionY(y);
          }}
        >
          <ScaledText
            variant="xl"
            allowScaling={false}
            className="text-center text-black font-neueMedium"
            style={styles.plansTitle}
          >
            Scegli un piano
          </ScaledText>

          {/* Billing Cycle Toggle */}
          <View
            className="flex-row items-center justify-center"
            style={{ gap: mvs(8), marginBottom: mvs(32) }}
          >
            <TouchableOpacity
              onPress={() => setBillingCycle("MONTHLY")}
              className="rounded-full items-center justify-center"
              style={{
                paddingVertical: mvs(8),
                paddingHorizontal: s(30),
                minWidth: s(98),
                borderWidth: 1,
                borderColor:
                  billingCycle === "MONTHLY" ? "transparent" : "#a49a99",
                backgroundColor:
                  billingCycle === "MONTHLY" ? "#AE0E0E" : "transparent",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-center font-neueLight"
                style={{
                  color: billingCycle === "MONTHLY" ? "#FFFFFF" : "#000000",
                }}
              >
                Monthly
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBillingCycle("YEARLY")}
              className="rounded-full items-center justify-center"
              style={{
                paddingVertical: mvs(8),
                paddingHorizontal: s(30),
                minWidth: s(98),
                borderWidth: 1,
                borderColor:
                  billingCycle === "YEARLY" ? "transparent" : "#a49a99",
                backgroundColor:
                  billingCycle === "YEARLY" ? "#AE0E0E" : "transparent",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-center font-neueLight"
                style={{
                  color: billingCycle === "YEARLY" ? "#FFFFFF" : "#000000",
                }}
              >
                Yearly
              </ScaledText>
            </TouchableOpacity>
          </View>

          {/* Premium Plan */}
          <View style={styles.planCard}>
            <LinearGradient
              colors={["#FFFFFF", "#FFCACA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planCardGradient}
            >
              <View style={styles.planCardContent}>
                <View style={styles.planHeader}>
                  <ScaledText
                    variant="lg"
                    allowScaling={false}
                    className="text-black font-neueMedium"
                    style={styles.planName}
                  >
                    Piano{" "}
                    <ScaledText
                      variant="lg"
                      allowScaling={false}
                      className="text-[#f79410] font-neueMedium"
                    >
                      premium
                    </ScaledText>
                  </ScaledText>
                </View>

                <View style={styles.planPriceContainer}>
                  <ScaledText
                    variant="4xl"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planPrice}
                  >
                    €{premiumPrice}/
                  </ScaledText>
                  <ScaledText
                    variant="md"
                    allowScaling={false}
                    className="text-black font-neueMedium"
                    style={styles.planPeriod}
                  >
                    {billingCycle === "MONTHLY" ? "month" : "year"}
                  </ScaledText>
                </View>

                <ScaledText
                  variant="sm"
                  allowScaling={false}
                  className="italic text-black font-neueBold"
                  style={styles.planDescription}
                >
                  For individual professionals who want to stand out and
                  showcase their expertise.
                </ScaledText>

                <View style={styles.planFeatures}>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueMedium"
                    style={styles.planIncludes}
                  >
                    Includes:
                  </ScaledText>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planFeature}
                  >
                    🎨 Add up to 3 styles
                  </ScaledText>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planFeature}
                  >
                    ⭐ Feature 2 favourites as premium
                  </ScaledText>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planFeature}
                  >
                    🏆 Show years of experience
                  </ScaledText>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planFeature}
                  >
                    🌍 Multi-location support
                  </ScaledText>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planFeature}
                  >
                    📂 Create collections of your work
                  </ScaledText>
                </View>

                <TouchableOpacity
                  style={styles.planButton}
                  activeOpacity={0.8}
                  onPress={() => handlePlanSelection("premium", "trial")}
                >
                  <ScaledText
                    variant="md"
                    allowScaling={false}
                    className="text-white font-neueMedium"
                  >
                    Start free trial
                  </ScaledText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.planButtonSecondary}
                  activeOpacity={0.8}
                  onPress={() => handlePlanSelection("premium", "buy")}
                >
                  <ScaledText
                    variant="md"
                    allowScaling={false}
                    className="text-primary font-neueMedium"
                  >
                    Buy Premium
                  </ScaledText>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Studio Plan */}
          <View style={styles.planCard}>
            <LinearGradient
              colors={["#FFFFFF", "#FFCACA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planCardGradient}
            >
              <View style={styles.planCardContent}>
                <View style={styles.planHeader}>
                  <ScaledText
                    variant="lg"
                    allowScaling={false}
                    className="text-black font-neueMedium"
                    style={styles.planName}
                  >
                    Piano{" "}
                    <ScaledText
                      variant="lg"
                      allowScaling={false}
                      className="text-primary font-neueMedium"
                    >
                      studio
                    </ScaledText>
                  </ScaledText>
                </View>

                <View style={styles.planPriceContainer}>
                  <ScaledText
                    variant="4xl"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planPrice}
                  >
                    €{studioPrice}/
                  </ScaledText>
                  <ScaledText
                    variant="md"
                    allowScaling={false}
                    className="text-black font-neueMedium"
                    style={styles.planPeriod}
                  >
                    {billingCycle === "MONTHLY" ? "month" : "year"}
                  </ScaledText>
                </View>

                <ScaledText
                  variant="sm"
                  allowScaling={false}
                  className="text-[#080101] font-neueBold italic"
                  style={styles.planDescription}
                >
                  For studios who need a comprehensive, branded presence.
                </ScaledText>

                <View style={styles.planFeatures}>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planIncludes}
                  >
                    Includes:
                  </ScaledText>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planFeature}
                  >
                    🎨 Add up to 5 styles
                  </ScaledText>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planFeature}
                  >
                    🏆 Highlight years of experience
                  </ScaledText>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planFeature}
                  >
                    🌍 Multi-location support
                  </ScaledText>
                  <ScaledText
                    variant="sm"
                    allowScaling={false}
                    className="text-black font-neueBold"
                    style={styles.planFeature}
                  >
                    🏢 Dedicated studio page with branding & visuals
                  </ScaledText>
                </View>

                <TouchableOpacity
                  style={styles.planButton}
                  activeOpacity={0.8}
                  onPress={() => handlePlanSelection("studio", "studio")}
                >
                  <ScaledText
                    variant="md"
                    allowScaling={false}
                    className="text-white font-neueMedium"
                  >
                    Get started
                  </ScaledText>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <ScaledText
            variant="6xl"
            allowScaling={false}
            className="text-center text-white font-neueMedium"
            style={styles.faqTitle}
          >
            FAQ
          </ScaledText>

          <View style={styles.faqItemContainer}>
            <TouchableOpacity
              style={styles.faqItem}
              onPress={() => toggleFaq(0)}
              activeOpacity={0.7}
            >
              <ScaledText
                variant="lg"
                allowScaling={false}
                className="text-white font-neueLight"
                style={styles.faqQuestion}
              >
                Lorem ipsum dolor sit amet and lorem ipsum dolor sit amet and
                lorem amet dolor ipsum?
              </ScaledText>
              <View style={styles.faqIcon}>
                <ScaledText
                  variant="xl"
                  allowScaling={false}
                  className="text-white"
                  style={styles.faqIconText}
                >
                  {expandedFaqs[0] ? "−" : "+"}
                </ScaledText>
              </View>
            </TouchableOpacity>
            {expandedFaqs[0] && (
              <View style={styles.faqAnswer}>
                <ScaledText
                  variant="md"
                  allowScaling={false}
                  className="text-white font-neueLight"
                  style={styles.faqAnswerText}
                >
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris.
                </ScaledText>
              </View>
            )}
          </View>

          <View style={styles.faqDivider} />

          <View style={styles.faqItemContainer}>
            <TouchableOpacity
              style={styles.faqItem}
              onPress={() => toggleFaq(1)}
              activeOpacity={0.7}
            >
              <ScaledText
                variant="lg"
                allowScaling={false}
                className="text-white font-neueLight"
                style={styles.faqQuestion}
              >
                Lorem ipsum dolor sit amet and lorem ipsum dolor sit amet and
                lorem amet dolor ipsum?
              </ScaledText>
              <View style={styles.faqIcon}>
                <ScaledText
                  variant="xl"
                  allowScaling={false}
                  className="text-white"
                  style={styles.faqIconText}
                >
                  {expandedFaqs[1] ? "−" : "+"}
                </ScaledText>
              </View>
            </TouchableOpacity>
            {expandedFaqs[1] && (
              <View style={styles.faqAnswer}>
                <ScaledText
                  variant="md"
                  allowScaling={false}
                  className="text-white font-neueLight"
                  style={styles.faqAnswerText}
                >
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris.
                </ScaledText>
              </View>
            )}
          </View>

          <View style={styles.faqDivider} />
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    backgroundColor: "#FFFFFF",
  },
  backButtonContainer: {
    position: "absolute",
    top: mvs(16),
    left: s(16),
    zIndex: 10,
  },
  backButton: {
    zIndex: 10,
  },
  logoSection: {
    alignItems: "center",
    paddingTop: mvs(50),
    paddingBottom: mvs(24),
  },
  logoContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  logoImage: {
    height: s(25),
    width: s(120),
  },
  proText: {
    marginRight: s(20),
    fontSize: s(20),
    lineHeight: s(25),
  },
  heroSection: {
    paddingHorizontal: s(24),
    paddingBottom: mvs(40),
    alignItems: "center",
  },
  heroTitle: {
    marginBottom: mvs(32),
    fontSize: s(28),
    lineHeight: s(36),
    maxWidth: s(320),
  },
  imageGrid: {
    width: "100%",
    height: mvs(450),
    position: "relative",
    marginTop: mvs(20),
    overflow: "visible",
  },
  gridImage: {
    position: "absolute",
    borderRadius: s(20),
  },
  gridImage1: {
    width: s(200),
    height: mvs(300),
    left: s(-60),
    top: -mvs(20),
    zIndex: 1,
  },
  gridImage2: {
    width: s(170),
    height: mvs(220),
    right: s(-40),
    top: mvs(60),
    zIndex: 2,
  },
  gridImage3: {
    width: s(250),
    height: mvs(250),
    left: s(20),
    top: mvs(200),
    zIndex: 3,
  },
  ctaSection: {
    paddingHorizontal: s(24),
    paddingVertical: mvs(40),
    alignItems: "center",
  },
  ctaQuestion: {
    marginBottom: mvs(24),
    fontSize: s(24),
  },
  ctaButton: {
    backgroundColor: "#EB001B",
    paddingVertical: mvs(12),
    paddingHorizontal: s(32),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: "#D9D9D9",
  },
  communitySection: {
    paddingHorizontal: s(24),
    paddingVertical: mvs(40),
    alignItems: "center",
  },
  communityText: {
    fontSize: s(24),
    lineHeight: s(32),
    maxWidth: s(320),
  },
  stepSection: {
    backgroundColor: "#000000",
    paddingVertical: mvs(40),
    paddingHorizontal: s(24),
    minHeight: mvs(600),
  },
  stepSection2: {
    backgroundColor: "#1a1a1b",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: mvs(24),
    paddingLeft: s(16),
  },
  stepNumber: {
    fontSize: s(100),
    lineHeight: s(120),
    opacity: 0.2,
    marginRight: s(16),
  },
  stepTitle: {
    fontSize: s(24),
    flex: 1,
  },
  stepImageContainer: {
    width: "100%",
    height: mvs(400),
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    // marginBottom: mvs(24),
  },
  stepImage: {
    width: s(280),
    height: mvs(400),
  },
  stepGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: mvs(260),
  },
  stepDescription: {
    fontSize: s(20),
    lineHeight: s(28),
    paddingHorizontal: s(16),
    marginTop: mvs(-40),
  },
  plansSection: {
    backgroundColor: "#FAF9F6",
    paddingVertical: mvs(60),
    paddingHorizontal: s(24),
  },
  plansTitle: {
    fontSize: s(24),
    marginBottom: mvs(40),
  },
  planCard: {
    marginBottom: mvs(32),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#A49A99",
    overflow: "hidden",
  },
  planCardGradient: {
    padding: s(20),
  },
  planCardContent: {
    // Content styling
  },
  planHeader: {
    marginBottom: mvs(16),
  },
  planName: {
    fontSize: s(18),
  },
  planPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: mvs(16),
  },
  planPrice: {
    fontSize: s(36),
    lineHeight: s(40),
    letterSpacing: -0.5,
  },
  planPeriod: {
    fontSize: s(14),
    marginLeft: s(4),
  },
  planDescription: {
    fontSize: s(11),
    lineHeight: s(14),
    marginBottom: mvs(24),
    color: "#080101",
  },
  planFeatures: {
    marginBottom: mvs(24),
  },
  planIncludes: {
    fontSize: s(11),
    marginBottom: mvs(8),
    color: "#080101",
  },
  planFeature: {
    fontSize: s(11),
    lineHeight: s(16),
    marginBottom: mvs(4),
  },
  planButton: {
    backgroundColor: "#AE0E0E",
    paddingVertical: mvs(12),
    paddingHorizontal: s(24),
    borderRadius: s(38),
    alignItems: "center",
    marginBottom: mvs(12),
  },
  planButtonSecondary: {
    paddingVertical: mvs(12),
    paddingHorizontal: s(24),
    borderRadius: s(38),
    alignItems: "center",
  },
  faqSection: {
    backgroundColor: "#610707",
    paddingVertical: mvs(30),
  },
  faqTitle: {
    fontSize: s(48),
    marginBottom: mvs(20),
  },
  faqItemContainer: {
    paddingHorizontal: s(24),
  },
  faqItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: mvs(8),
  },
  faqQuestion: {
    flex: 1,
    fontSize: s(20),
    lineHeight: s(28),
    marginRight: s(16),
  },
  faqIcon: {
    width: s(24),
    height: s(24),
    alignItems: "center",
    justifyContent: "center",
  },
  faqIconText: {
    fontSize: s(28),
    lineHeight: s(28),
  },
  faqAnswer: {
    marginTop: mvs(16),
    paddingLeft: s(0),
    paddingRight: s(40),
  },
  faqAnswerText: {
    fontSize: s(16),
    lineHeight: s(24),
  },
  faqDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255)",
    marginVertical: mvs(16),
  },
});
