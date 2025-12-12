import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuthRequiredStore } from "@/stores/authRequiredStore";
import { mvs, s, scaledFont } from "@/utils/scale";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import React from "react";
import { Modal, Pressable, View } from "react-native";

export function AuthRequiredModal() {
  const { isVisible, message, isDismissible, hide } = useAuthRequiredStore();

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={isDismissible ? hide : () => {}}
    >
      {/* Overlay */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: s(24),
        }}
        onPress={isDismissible ? hide : undefined}
      >
        {/* Modal Card */}
        <Pressable
          style={{
            width: "100%",
            maxWidth: s(400),
            borderRadius: s(16),
            overflow: "hidden",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={{
              borderRadius: s(16),
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(10, 1, 1, 0.9)",
                padding: s(24),
                paddingTop: s(32),
              }}
            >
              {/* Close Button - only show if dismissible */}
              {isDismissible && (
                <Pressable
                  onPress={hide}
                  style={{
                    position: "absolute",
                    top: s(12),
                    right: s(12),
                    padding: s(8),
                    zIndex: 10,
                  }}
                >
                  <SVGIcons.Close width={s(20)} height={s(20)} />
                </Pressable>
              )}

              {/* Icon */}
              <View style={{ alignItems: "center", marginBottom: mvs(16) }}>
                <SVGIcons.SecurePerson width={s(64)} height={s(64)} />
              </View>

              {/* Message */}
              <ScaledText
                allowScaling={false}
                className="text-white font-neueMedium text-center"
                style={{
                  fontSize: scaledFont(18),
                  marginBottom: mvs(8),
                }}
              >
                Sign in required
              </ScaledText>

              <ScaledText
                allowScaling={false}
                className="text-gray font-montserratRegular text-center"
                style={{
                  fontSize: scaledFont(14),
                  color: "#A49A99",
                  marginBottom: mvs(24),
                }}
              >
                {message}
              </ScaledText>

              {/* Buttons */}
              <View style={{ gap: mvs(12) }}>
                {/* Sign In Button */}
                <Pressable
                  onPress={() => {
                    hide();
                    router.push("/(auth)/login");
                  }}
                  style={{
                    backgroundColor: "#C1272D",
                    borderRadius: s(8),
                    paddingVertical: mvs(14),
                    alignItems: "center",
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    className="text-white font-neueMedium"
                    style={{ fontSize: scaledFont(16) }}
                  >
                    Sign In
                  </ScaledText>
                </Pressable>

                {/* Create Account Button */}
                <Pressable
                  onPress={() => {
                    hide();
                    router.push("/(auth)/register");
                  }}
                  style={{
                    backgroundColor: "transparent",
                    borderRadius: s(8),
                    paddingVertical: mvs(14),
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    className="text-white font-neueMedium"
                    style={{ fontSize: scaledFont(16) }}
                  >
                    Create Account
                  </ScaledText>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
