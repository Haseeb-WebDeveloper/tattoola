import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { mvs, s, scaledFont } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { ValidationRules, ValidationUtils } from "@/utils/validation";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

type Step = "password" | "email";

export default function EmailSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  console.log("User is at email settings screen");

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>("password");

  // Password step
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // NEW: Confirm Password State for Password Step
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email step
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [newEmailError, setNewEmailError] = useState("");
  const [confirmEmailError, setConfirmEmailError] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    currentStep === "password"
      ? currentPassword.trim() !== "" || confirmPassword.trim() !== ""
      : newEmail.trim() !== "" || confirmEmail.trim() !== "";

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else if (currentStep === "email") {
      // Go back to password step
      setCurrentStep("password");
      setNewEmail("");
      setConfirmEmail("");
      setNewEmailError("");
      setConfirmEmailError("");
    } else {
      router.back();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    if (currentStep === "email") {
      setCurrentStep("password");
      setNewEmail("");
      setConfirmEmail("");
      setNewEmailError("");
      setConfirmEmailError("");
    } else {
      // Also clear password step fields and errors
      setCurrentPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setConfirmPasswordError("");
      router.back();
    }
  };

  const handleContinueEditing = () => {
    setShowUnsavedModal(false);
  };

  const handlePasswordChange = (text: string) => {
    setCurrentPassword(text);
    if (passwordError) {
      setPasswordError("");
    }
    // Also clear confirmPasswordError if previously set and fields now match
    if (confirmPasswordError && text === confirmPassword) {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
    // Also clear passwordError if previously set and fields now match
    if (passwordError && text === currentPassword) {
      setPasswordError("");
    }
  };

  const handleNewEmailChange = (text: string) => {
    setNewEmail(text.toLowerCase().trim());
    if (newEmailError) {
      setNewEmailError("");
    }
    if (confirmEmailError) {
      setConfirmEmailError("");
    }
  };

  const handleConfirmEmailChange = (text: string) => {
    setConfirmEmail(text.toLowerCase().trim());
    if (confirmEmailError) {
      setConfirmEmailError("");
    }
  };

  // Add confirm password validation before verifying
  const validatePasswordStep = (): boolean => {
    let isValid = true;
    setPasswordError("");
    setConfirmPasswordError("");

    if (!currentPassword.trim()) {
      setPasswordError("Current password is required");
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (currentPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }
    return isValid;
  };

  const verifyCurrentPassword = async (): Promise<boolean> => {
    // confirmPassword validation will be handled before calling this
    // so ONLY check currentPassword here as before
    setIsVerifyingPassword(true);

    try {
      // Try to sign in with current credentials to verify password
      const { error } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: currentPassword,
      });

      if (error) {
        setPasswordError("The password is incorrect");
        return false;
      }

      return true;
    } catch (err) {
      setPasswordError("The password is incorrect");
      return false;
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handlePasswordNext = async () => {
    // First validate password match
    const fieldValid = validatePasswordStep();
    if (!fieldValid) {
      return;
    }

    const isValid = await verifyCurrentPassword();
    if (isValid) {
      setCurrentStep("email");
      // Optionally clear password fields for security
      // setCurrentPassword("");
      // setConfirmPassword("");
    }
  };

  const validateEmails = (): boolean => {
    setNewEmailError("");
    setConfirmEmailError("");
    let isValid = true;

    // Validate new email
    const emailValidation = ValidationUtils.validateField(
      newEmail,
      ValidationRules.email
    );
    if (emailValidation) {
      setNewEmailError(emailValidation);
      isValid = false;
    }

    // Check if email is same as current
    if (newEmail === user?.email) {
      setNewEmailError("New email must be different from current email");
      isValid = false;
    }

    // Validate confirm email
    if (!confirmEmail.trim()) {
      setConfirmEmailError("Please confirm your email");
      isValid = false;
    } else if (newEmail !== confirmEmail) {
      setConfirmEmailError("Both emails don't match");
      isValid = false;
    }

    return isValid;
  };

  const handleEmailUpdate = async () => {
    if (!validateEmails()) {
      return;
    }

    setIsUpdatingEmail(true);

    try {
      console.log("Updating email to:", newEmail);

      // Update email in Supabase Auth
      const { data, error } = await supabase.auth.updateUser(
        {
          email: newEmail,
        },
        {
          emailRedirectTo: "tattoola://verify", // Match expo-router route (groups don't create segments)
        }
      );

      console.log("UpdateUser Response:", { data, error });

      if (error) {
        console.log("Error updating email:", error);
        toast.error(error.message || "Failed to update email");
        setIsUpdatingEmail(false); // Explicit clear on error
        return;
      }

      console.log("Email update initiated successfully");
      setIsUpdatingEmail(false); // Clear BEFORE navigation
      toast.success(
        "Verification emails sent! Check both your old and new email addresses."
      );

      // Small delay to ensure state updates
      setTimeout(() => {
        router.replace("/settings/email-confirmation" as any);
      }, 100);
    } catch (err: any) {
      console.error("Error updating email:", err);
      toast.error(err.message || "Failed to update email");
      setIsUpdatingEmail(false); // Explicit clear on catch
    }
  };

  // Update: password step is valid only if both fields are filled AND match
  const isPasswordStepValid =
    currentPassword.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    currentPassword === confirmPassword;

  const isEmailStepValid = newEmail.trim() !== "" && confirmEmail.trim() !== "";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
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
            {currentStep === "password" ? "Modifica email" : "New email"}
          </ScaledText>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          style={{ paddingHorizontal: s(16) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === "password" ? (
            /* Password Verification Step */
            <>
              {/* Description */}
              <View style={{ marginBottom: mvs(24) }}>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratMedium text-center"
                >
                  Per richiedere la modifica della mail devi inserire prima la
                  tua password attuale.
                </ScaledText>
              </View>

              {/* Current Password */}
              <View style={{ marginBottom: mvs(16) }}>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratMedium"
                  style={{ marginBottom: mvs(6) }}
                >
                  Inserire la password
                </ScaledText>
                <View>
                  <ScaledTextInput
                    value={currentPassword}
                    onChangeText={handlePasswordChange}
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isVerifyingPassword}
                    className="text-foreground font-medium"
                    containerClassName="rounded-lg"
                    containerStyle={{
                      borderWidth: s(1),
                      borderColor: passwordError ? "#DC3545" : "#A49A99",
                      backgroundColor: "#100C0C",
                    }}
                    style={{
                      fontSize: scaledFont(14),
                      fontFamily: "Montserrat-Medium",
                      paddingRight: s(48),
                    }}
                    rightAccessory={
                      <TouchableOpacity
                        onPress={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        style={{
                          position: "absolute",
                          right: s(16),
                          top: 0,
                          bottom: 0,
                          justifyContent: "center",
                        }}
                      >
                        {showCurrentPassword ? (
                          <SVGIcons.EyeOpen width={s(20)} height={s(20)} />
                        ) : (
                          <SVGIcons.EyeClose width={s(20)} height={s(20)} />
                        )}
                      </TouchableOpacity>
                    }
                  />
                </View>
                {passwordError ? (
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-error"
                    style={{ marginTop: mvs(8) }}
                  >
                    {passwordError}
                  </ScaledText>
                ) : null}
              </View>

              {/* Confirm Current Password */}
              <View style={{ marginBottom: mvs(24) }}>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratMedium"
                  style={{ marginBottom: mvs(6) }}
                >
                  Conferma Password
                </ScaledText>
                <View>
                  <ScaledTextInput
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isVerifyingPassword}
                    className="text-foreground font-medium"
                    containerClassName="rounded-lg"
                    containerStyle={{
                      borderWidth: s(1),
                      borderColor: confirmPasswordError ? "#DC3545" : "#A49A99",
                      backgroundColor: "#100C0C",
                    }}
                    style={{
                      fontSize: scaledFont(14),
                      fontFamily: "Montserrat-Medium",
                      paddingRight: s(48),
                    }}
                    rightAccessory={
                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        style={{
                          position: "absolute",
                          right: s(16),
                          top: 0,
                          bottom: 0,
                          justifyContent: "center",
                        }}
                      >
                        {showConfirmPassword ? (
                          <SVGIcons.EyeOpen width={s(20)} height={s(20)} />
                        ) : (
                          <SVGIcons.EyeClose width={s(20)} height={s(20)} />
                        )}
                      </TouchableOpacity>
                    }
                  />
                </View>
                {confirmPasswordError ? (
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-error"
                    style={{ marginTop: mvs(8) }}
                  >
                    {confirmPasswordError}
                  </ScaledText>
                ) : null}
              </View>
            </>
          ) : (
            /* Email Update Step */
            <>
              {/* Description */}
              <View style={{ marginBottom: mvs(24) }}>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratMedium text-center"
                >
                  Inserisci il nuovo indirizzo e-mail che desideri usare in
                  Tattoola
                </ScaledText>
              </View>

              {/* Current Email Info */}
              {/* <View style={{ marginBottom: mvs(24) }}>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratMedium"
                  style={{ marginBottom: mvs(4) }}
                >
                  Current email
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratSemibold"
                >
                  {user?.email}
                </ScaledText>
              </View> */}

              {/* New Email */}
              <View style={{ marginBottom: mvs(16) }}>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratMedium"
                  style={{ marginBottom: mvs(6) }}
                >
                  Inserire la nouve email
                </ScaledText>
                <ScaledTextInput
                  value={newEmail}
                  onChangeText={handleNewEmailChange}
                  placeholder={user?.email || "Enter new email"}
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isUpdatingEmail}
                  className="text-foreground font-medium"
                  containerClassName="rounded-lg"
                  containerStyle={{
                    borderWidth: s(1),
                    borderColor: newEmailError ? "#DC3545" : "#A49A99",
                    backgroundColor: "#100C0C",
                  }}
                  style={{
                    fontSize: scaledFont(14),
                    fontFamily: "Montserrat-Medium",
                  }}
                />
                {newEmailError ? (
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-error"
                    style={{ marginTop: mvs(8) }}
                  >
                    {newEmailError}
                  </ScaledText>
                ) : null}
              </View>

              {/* Confirm New Email */}
              <View style={{ marginBottom: mvs(24) }}>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratMedium"
                  style={{ marginBottom: mvs(6) }}
                >
                  Conferma email
                </ScaledText>
                <ScaledTextInput
                  value={confirmEmail}
                  onChangeText={handleConfirmEmailChange}
                  placeholder="Re-enter new email"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isUpdatingEmail}
                  className="text-foreground font-medium"
                  containerClassName="rounded-lg"
                  containerStyle={{
                    borderWidth: s(1),
                    borderColor: confirmEmailError ? "#DC3545" : "#A49A99",
                    backgroundColor: "#100C0C",
                  }}
                  style={{
                    fontSize: scaledFont(14),
                    fontFamily: "Montserrat-Medium",
                  }}
                />
                {confirmEmailError ? (
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-error"
                    style={{ marginTop: mvs(8) }}
                  >
                    {confirmEmailError}
                  </ScaledText>
                ) : null}
              </View>
            </>
          )}
        </ScrollView>

        {/* Action Button */}
        <View
          style={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
          }}
        >
          <TouchableOpacity
            onPress={
              currentStep === "password"
                ? handlePasswordNext
                : handleEmailUpdate
            }
            disabled={
              currentStep === "password"
                ? isVerifyingPassword || !isPasswordStepValid
                : isUpdatingEmail || !isEmailStepValid
            }
            className="rounded-full items-center justify-center flex-row"
            style={{
              backgroundColor:
                currentStep === "password"
                  ? isVerifyingPassword || !isPasswordStepValid
                    ? "#6B2C2C"
                    : "#AD2E2E"
                  : isUpdatingEmail || !isEmailStepValid
                    ? "#6B2C2C"
                    : "#AD2E2E",
              paddingVertical: mvs(10.5),
              paddingLeft: s(18),
              paddingRight: s(20),
            }}
          >
            {/* {(isVerifyingPassword || isUpdatingEmail) && (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={{ marginRight: s(8) }}
              />
            )} */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-medium"
            >
              {currentStep === "password"
                ? isVerifyingPassword
                  ? "Verifying..."
                  : "Next"
                : isUpdatingEmail
                  ? "Updating..."
                  : "Update Email"}
            </ScaledText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Unsaved Changes Modal */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        onRequestClose={handleContinueEditing}
      >
        <View
          className="flex-1 justify-center items-center"
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
            {/* Warning Icon */}
            <View className="items-center" style={{ marginBottom: mvs(20) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>

            {/* Title */}
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-background font-neueBold text-center"
              style={{ marginBottom: mvs(4) }}
            >
              You have unsaved changes
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(32) }}
            >
              Do you want to discard them?
            </ScaledText>

            {/* Action Buttons */}
            <View style={{ gap: mvs(4) }} className="flex-row justify-center">
              {/* Continue Editing Button */}
              <TouchableOpacity
                onPress={handleContinueEditing}
                className="rounded-full border-2 items-center justify-center flex-row"
                style={{
                  borderColor: "#AD2E2E",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  gap: s(8),
                }}
              >
                <SVGIcons.PenRed
                  style={{ width: s(14), height: s(14) }}
                  fill="#AD2E2E"
                />
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="font-montserratMedium"
                  style={{ color: "#AD2E2E" }}
                >
                  Continue Editing
                </ScaledText>
              </TouchableOpacity>

              {/* Discard Changes Button */}
              <TouchableOpacity
                onPress={handleDiscardChanges}
                className="rounded-full items-center justify-center"
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
                  Discard changes
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
