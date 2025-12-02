import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  acceptStudioInvitation,
  rejectStudioInvitation,
} from "@/services/studio.invitation.service";
import { mvs, s } from "@/utils/scale";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

const STORAGE_KEY = "pending_studio_invitation_token";

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

export default function StudioInvitationAcceptScreen() {
  const router = useRouter();
  const { user, initialized, loading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ token?: string }>();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    studioName: string;
    studioLogo?: string | null;
    senderName: string;
    token: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized && authLoading) {
      return;
    }

    const loadInvitationData = async () => {
      try {
        setLoading(true);
        let token = params.token;

        // If no token in params, check AsyncStorage (for unauthenticated users)
        if (!token) {
          const storedToken = await AsyncStorage.getItem(STORAGE_KEY);
          if (storedToken) {
            token = storedToken;
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }

        if (!token) {
          setError("Link di invito non valido");
          setLoading(false);
          return;
        }

        // Verify user is authenticated - check both useAuth and direct session
        let currentUserId = user?.id;
        if (!currentUserId && initialized) {
          const { supabase } = await import("@/utils/supabase");
          const { data: sessionData } = await supabase.auth.getSession();
          currentUserId = sessionData?.session?.user?.id || undefined;
        }

        if (!currentUserId) {
          // Store token and redirect to login
          await AsyncStorage.setItem(STORAGE_KEY, token);
          router.replace("/(auth)/login");
          return;
        }

        // Fetch invitation details from Supabase
        const { supabase } = await import("@/utils/supabase");
        const { data: invitation, error: fetchError } = await supabase
          .from("studio_members")
          .select(
            `
            invitationToken,
            status,
            studio:studios!studio_members_studioId_fkey(
              name,
              logo
            ),
            inviter:users!studio_members_invitedBy_fkey(
              firstName,
              lastName,
              username
            )
          `
          )
          .eq("invitationToken", token)
          .eq("userId", currentUserId)
          .single();

        if (fetchError || !invitation) {
          setError("Invito non valido o scaduto");
          setLoading(false);
          return;
        }

        if (invitation.status !== "PENDING") {
          setError(
            invitation.status === "ACCEPTED"
              ? "Questo invito è già stato accettato"
              : "Questo invito è stato rifiutato"
          );
          setLoading(false);
          return;
        }

        const studio = invitation.studio as any;
        const inviter = invitation.inviter as any;

        const senderName =
          inviter?.firstName && inviter?.lastName
            ? `${inviter.firstName} ${inviter.lastName}`
            : inviter?.username || "Titolare dello studio";

        const invitationDataToSet = {
          studioName: studio?.name || "Studio",
          studioLogo: studio?.logo,
          senderName: senderName,
          token: token,
        };

        setInvitationData(invitationDataToSet);
      } catch (err: any) {
        console.error("Error loading invitation:", err);
        setError(err.message || "Caricamento dell'invito non riuscito");
      } finally {
        setLoading(false);
      }
    };

    loadInvitationData();
  }, [params.token, user?.id, initialized, authLoading]);

  const handleAccept = async () => {
    if (!invitationData || !user?.id) return;

    try {
      setProcessing(true);
      const result = await acceptStudioInvitation(
        invitationData.token,
        user.id
      );

      if (result.success) {
        toast.success(`Ti sei unito a ${result.studioName}!`);
        setTimeout(() => {
          router.replace("/settings/studio" as any);
        }, 1000);
      } else {
        toast.error(result.error || "Accettazione dell'invito non riuscita");
        setError(result.error || "Accettazione dell'invito non riuscita");
      }
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      toast.error(err.message || "Accettazione dell'invito non riuscita");
      setError(err.message || "Accettazione dell'invito non riuscita");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitationData || !user?.id) return;

    try {
      setProcessing(true);
      const result = await rejectStudioInvitation(
        invitationData.token,
        user.id
      );

      if (result.success) {
        toast.success("Invito rifiutato");
        setTimeout(() => {
          router.replace("/(tabs)" as any);
        }, 1000);
      } else {
        toast.error(result.error || "Impossibile rifiutare l'invito");
        setError(result.error || "Impossibile rifiutare l'invito");
      }
    } catch (err: any) {
      console.error("Error declining invitation:", err);
      toast.error(err.message || "Impossibile rifiutare l'invito");
      setError(err.message || "Impossibile rifiutare l'invito");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View className="items-center justify-center flex-1 bg-background">
        <ActivityIndicator size="large" color="#CA2323" />
      </View>
    );
  }

  if (error || !invitationData) {
    return (
      <View className="flex-1 bg-background">
        <LinearGradient
          colors={["#000000", "#0F0202"]}
          start={{ x: 0.4, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: s(24),
            }}
          >
            <SVGIcons.Warning width={s(64)} height={s(64)} className="mb-4" />
            <ScaledText
              allowScaling={false}
              variant="xl"
              className="mb-2 text-center text-white font-neueSemibold"
            >
              Invito non valido
            </ScaledText>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="mb-6 text-center text-foreground font-montserratRegular"
            >
              {error || "Questo link di invito non è valido o è scaduto."}
            </ScaledText>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)" as any)}
              className="rounded-full bg-primary"
              style={{
                paddingVertical: mvs(12),
                paddingHorizontal: s(24),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-white font-neueSemibold"
              >
                Vai alla Home
              </ScaledText>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  const studioLogoUrl = resolveImageUrl(invitationData.studioLogo);

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: s(24),
            paddingTop: mvs(60),
            paddingBottom: mvs(40),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Studio Logo */}
          <View className="items-center mb-6">
            {studioLogoUrl ? (
              <Image
                source={{ uri: studioLogoUrl }}
                style={{
                  width: s(120),
                  height: s(120),
                  borderRadius: s(60),
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="items-center justify-center rounded-full bg-foreground/10"
                style={{
                  width: s(120),
                  height: s(120),
                }}
              >
                <SVGIcons.Studio width={s(60)} height={s(60)} />
              </View>
            )}
          </View>

          {/* Title */}
          <ScaledText
            allowScaling={false}
            variant="2xl"
            className="mb-4 text-center text-white font-neueSemibold"
          >
            Invito allo studio
          </ScaledText>

          {/* Message */}
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="mb-2 text-center text-foreground font-montserratRegular"
          >
            Sei stato invitato a unirti a
          </ScaledText>
          <ScaledText
            allowScaling={false}
            variant="xl"
            className="mb-6 text-center text-primary font-neueSemibold"
          >
            {invitationData.studioName}
          </ScaledText>

          {/* Sender Info */}
          <View className="items-center mb-8">
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-montserratRegular"
            >
              Invitato da
            </ScaledText>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="mt-1 text-white font-neueSemibold"
            >
              {invitationData.senderName}
            </ScaledText>
          </View>

          {/* Buttons */}
          <View
            className="justify-end flex-1"
            style={{ gap: s(12), marginTop: mvs(40) }}
          >
            <TouchableOpacity
              onPress={handleAccept}
              disabled={processing}
              className="items-center justify-center rounded-full bg-primary"
              style={{
                paddingVertical: mvs(14),
              }}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-white font-neueSemibold"
                >
                  Conferma
                </ScaledText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDecline}
              disabled={processing}
              className="items-center justify-center border rounded-full bg-foreground/10 border-gray"
              style={{
                paddingVertical: mvs(14),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-white font-neueSemibold"
              >
                Rifiuta
              </ScaledText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
