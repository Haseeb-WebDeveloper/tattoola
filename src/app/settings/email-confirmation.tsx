import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

export default function EmailConfirmationScreen() {
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);

  const handleClose = () => {
    router.replace("/settings" as any);
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      // Get the current user's new unconfirmed email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser?.new_email) {
        toast.error("No pending email change found");
        setIsResending(false);
        return;
      }

      // Resend the email verification
      const { error } = await supabase.auth.updateUser({
        email: authUser.new_email,
      });

      if (error) {
        console.error("Error resending verification email:", error);
        toast.error("Failed to resend email");
      } else {
        toast.success("Verification email resent");
      }
    } catch (err: any) {
      console.error("Error resending verification email:", err);
      toast.error(err.message || "Failed to resend email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <LinearGradient
      colors={["#000000", "#0F0202"]}
      start={{ x: 0.4, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with close and logo */}
        <View style={{ paddingHorizontal: s(16), marginTop: mvs(32) }}>
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
            >
              <SVGIcons.Close className="w-8 h-8" />
            </TouchableOpacity>
            <SVGIcons.LogoLight className="h-10" />
            <View className="w-10" />
          </View>
          <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
        </View>

        {/* Title and instructions */}
        <View style={{ paddingHorizontal: s(24), marginTop: mvs(40) }}>
          <View className="px-6 mb-2 flex-row gap-2 items-center justify-center">
            <SVGIcons.MailSent className="w-7 h-7" />
            <ScaledText
              variant="sectionTitle"
              className="text-foreground font-neueBold"
            >
              Verification emails sent
            </ScaledText>
          </View>
          <ScaledText
            variant="body2"
            className="text-foreground font-montserratLight text-center"
          >
            Check BOTH your old and new email addresses for confirmation links
          </ScaledText>
        </View>

        {/* Image */}
        <View className="items-center my-8">
          <Image
            source={require("@/assets/auth/email-sent.png")}
            className="w-[320px] h-[220px] rounded-xl"
            resizeMode="contain"
          />
        </View>

        {/* Resend */}
        <View className="items-center">
          <ScaledText
            variant="body2"
            className="text-foreground font-montserratLight"
          >
            Haven't received the email?
          </ScaledText>
          <TouchableOpacity
            className="px-6 py-3 rounded-full border border-foreground/60 flex-row gap-2 items-center mt-4"
            onPress={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <SVGIcons.Reload className="w-5 h-5" />
            )}
            <ScaledText
              variant="body2"
              className="text-foreground font-montserratLight"
            >
              {isResending ? "Sending..." : "Resend email"}
            </ScaledText>
          </TouchableOpacity>
          <View className="h-px bg-[#A49A99] opacity-40 w-4/5 my-8" />
        </View>

        {/* Note */}
        <View style={{ paddingHorizontal: s(48), marginBottom: mvs(32) }}>
          <ScaledText
            variant="body2"
            className="text-foreground/80 font-montserratLight text-center"
          >
            Step 1: Click the confirmation link in your OLD email{"\n"}
            Step 2: Click the verification link in your NEW email{"\n"}
            {"\n"}
            After completing both steps, your email will be updated.
          </ScaledText>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

