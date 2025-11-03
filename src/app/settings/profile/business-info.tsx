import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/providers/AuthProvider";
import { cloudinaryService } from "@/services/cloudinary.service";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

export default function BusinessInfoSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const [artistId, setArtistId] = useState<string | null>(null);

  // Editable fields
  const [businessName, setBusinessName] = useState<string>("");
  const [studioAddress, setStudioAddress] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  // Initial snapshot for dirty check
  const [initial, setInitial] = useState({
    businessName: "",
    studioAddress: "",
    website: "",
    phone: "",
    certificateUrl: null as string | null,
  });

  // Display-only
  const [locationLabel, setLocationLabel] = useState<string>("Not set");

  const hasUnsavedChanges = useMemo(() => {
    return (
      businessName.trim() !== initial.businessName.trim() ||
      studioAddress.trim() !== initial.studioAddress.trim() ||
      website.trim() !== initial.website.trim() ||
      phone.trim() !== initial.phone.trim() ||
      certificateUrl !== initial.certificateUrl
    );
  }, [businessName, studioAddress, website, phone, certificateUrl, initial]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (!user?.id) return;

        // Load artist profile
        const { data: ap, error: apErr } = await supabase
          .from("artist_profiles")
          .select(
            "id,businessName,studioAddress,website,phone,certificateUrl,isStudioOwner"
          )
          .eq("userId", user.id)
          .single();

        if (apErr || !ap) throw new Error("Artist profile not found");

        if (!mounted) return;
        setArtistId(ap.id);
        setBusinessName(ap.businessName || "");
        setStudioAddress(ap.studioAddress || "");
        setWebsite(ap.website || "");
        setPhone(ap.phone || "");
        setCertificateUrl(ap.certificateUrl || null);
        setInitial({
          businessName: ap.businessName || "",
          studioAddress: ap.studioAddress || "",
          website: ap.website || "",
          phone: ap.phone || "",
          certificateUrl: ap.certificateUrl || null,
        });

        // Resolve primary location per spec
        let municipalityId: string | null = null;
        let provinceId: string | null = null;

        if (ap.isStudioOwner) {
          const { data: studio } = await supabase
            .from("studios")
            .select("id")
            .eq("ownerId", ap.id)
            .maybeSingle();

          if (studio?.id) {
            const { data: sl } = await supabase
              .from("studio_locations")
              .select("municipalityId,provinceId")
              .eq("studioId", studio.id)
              .eq("isPrimary", true)
              .maybeSingle();
            if (sl) {
              municipalityId = sl.municipalityId;
              provinceId = sl.provinceId;
            }
          }
        }

        if (!municipalityId || !provinceId) {
          const { data: ul } = await supabase
            .from("user_locations")
            .select("municipalityId,provinceId")
            .eq("userId", user.id)
            .eq("isPrimary", true)
            .maybeSingle();
          if (ul) {
            municipalityId = ul.municipalityId;
            provinceId = ul.provinceId;
          }
        }

        if (municipalityId && provinceId) {
          const [{ data: mun }, { data: prov }] = await Promise.all([
            supabase
              .from("municipalities")
              .select("name")
              .eq("id", municipalityId)
              .single(),
            supabase
              .from("provinces")
              .select("name")
              .eq("id", provinceId)
              .single(),
          ]);
          if (mun?.name && prov?.name) {
            setLocationLabel(`${mun.name}, ${prov.name}`);
          } else {
            setLocationLabel("Not set");
          }
        } else {
          setLocationLabel("Not set");
        }
      } catch (error: any) {
        console.error("Error loading business info:", error);
        toast.error(error.message || "Failed to load business info");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      router.back();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    router.back();
  };

  const handleContinueEditing = () => {
    setShowUnsavedModal(false);
  };

  const validate = () => {
    if (website.trim()) {
      const re =
        /^(https?:\/\/)[\w.-]+(\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]*$/i;
      if (!re.test(website.trim())) {
        toast.error("Invalid website URL");
        return false;
      }
    }
    if (phone.trim()) {
      const clean = phone.trim();
      const rePhone = /^\+?[0-9\s().-]{6,}$/;
      if (!rePhone.test(clean)) {
        toast.error("Invalid phone number");
        return false;
      }
    }
    return true;
  };

  const handlePickCertificate = async () => {
    try {
      const files = await pickFiles({
        mediaType: "image",
        allowsMultipleSelection: false,
        maxFiles: 1,
        cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions("image"),
      });
      if (!files || files.length === 0) return;

      const file = files[0];
      const maxSize = 10 * 1024 * 1024;
      if (file.fileSize && file.fileSize > maxSize) {
        toast.error("Image size must be less than 10MB");
        return;
      }

      const uploaded = await uploadToCloudinary(
        [file],
        cloudinaryService.getPortfolioUploadOptions("image")
      );
      if (uploaded && uploaded[0]?.cloudinaryResult?.secureUrl) {
        setCertificateUrl(uploaded[0].cloudinaryResult.secureUrl);
      }
    } catch (err: any) {
      console.error("Error uploading certificate:", err);
      toast.error(err.message || "Failed to upload certificate");
    }
  };

  const handleSave = async () => {
    if (!artistId) {
      toast.error("Artist profile not found");
      return;
    }
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }
    if (!validate()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("artist_profiles")
        .update({
          businessName: businessName.trim() || null,
          studioAddress: studioAddress.trim() || null,
          website: website.trim() || null,
          phone: phone.trim() || null,
          certificateUrl: certificateUrl || null,
        })
        .eq("id", artistId);
      if (error) throw error;

      await clearProfileCache(user!.id);
      toast.success("Business info updated successfully");

      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error saving business info:", err);
      toast.error(err.message || "Failed to update business info");
    } finally {
      setIsSaving(false);
    }
  };

  const renderTextInput = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    placeholder: string,
    keyboardType: "default" | "url" | "phone-pad" = "default"
  ) => (
    <View style={{ marginBottom: mvs(24) }}>
      <ScaledText
        allowScaling={false}
        variant="sm"
        className="text-tat font-montserratSemibold"
        style={{ marginBottom: mvs(8) }}
      >
        {label}
      </ScaledText>
      <ScaledTextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#666"
        editable={!loading && !isSaving && !uploading}
        keyboardType={keyboardType}
        containerClassName=""
        className="text-foreground font-medium"
        containerStyle={{
          backgroundColor: "#100C0C",
          borderColor: "#A49A99",
          borderWidth: 1,
          borderRadius: 12,
        }}
        style={{
          fontSize: 14,
        }}
      />
    </View>
  );

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
            La tua attività
          </ScaledText>
        </View>

        {/* Divider */}
        <View
          className="bg-gray"
          style={{
            height: s(1),
            marginBottom: mvs(32),
            marginHorizontal: s(16),
          }}
        />

        {/* Content */}
        <ScrollView
          style={{ flex: 1, paddingHorizontal: s(16) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderTextInput(
            "Nome studio",
            businessName,
            setBusinessName,
            "Es. Black Rose Tattoo"
          )}

          {/* Location (read-only) */}
          <View style={{ marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-montserratMedium"
              style={{ marginBottom: mvs(8) }}
            >
              Posizione primaria
            </ScaledText>
            <View
              className="flex-row items-center rounded-xl border border-gray"
              style={{
                backgroundColor: "#100C0C",
                paddingHorizontal: s(16),
                paddingVertical: mvs(12),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratMedium"
              >
                {loading ? "Loading..." : locationLabel}
              </ScaledText>
            </View>
          </View>

          {renderTextInput(
            "Indirizzo studio",
            studioAddress,
            setStudioAddress,
            "Via Roma, 10 — Milano"
          )}

          {renderTextInput(
            "Sito web",
            website,
            setWebsite,
            "https://example.com",
            "url"
          )}

          {renderTextInput(
            "Numero di telefono",
            phone,
            setPhone,
            "+39 345 678 9012",
            "phone-pad"
          )}

          {/* Certificate Upload */}
          <View style={{ marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat font-montserratSemibold"
              style={{ marginBottom: mvs(8) }}
            >
              Certificato
            </ScaledText>
            {certificateUrl ? (
              <View className="relative">
                <Image
                  source={{ uri: certificateUrl }}
                  style={{
                    width: "100%",
                    height: mvs(140),
                    borderRadius: s(8),
                    backgroundColor: "#100C0C",
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={handlePickCertificate}
                  disabled={uploading || loading || isSaving}
                  className="absolute bg-foreground rounded-full items-center justify-center"
                  style={{
                    width: s(28),
                    height: s(28),
                    right: s(10),
                    top: s(10),
                  }}
                >
                  <SVGIcons.PenRed width={s(14)} height={s(14)} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickCertificate}
                disabled={uploading || loading || isSaving}
                className="bg-[#100C0C] border-dashed border-primary rounded-xl items-center justify-center"
                style={{ height: mvs(100), borderWidth: s(1) }}
              >
                {uploading ? (
                  <ActivityIndicator color="#AD2E2E" />
                ) : (
                  <SVGIcons.AddRed width={s(24)} height={s(32)} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View
          style={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
            paddingTop: mvs(16),
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving || loading || uploading || !hasUnsavedChanges}
            className="rounded-full items-center justify-center flex-row"
            style={{
              backgroundColor:
                isSaving || loading || uploading || !hasUnsavedChanges
                  ? "#6B2C2C"
                  : "#AD2E2E",
              paddingVertical: mvs(10.5),
              paddingLeft: s(18),
              paddingRight: s(20),
              gap: s(8),
            }}
          >
            {(isSaving || uploading) && (
              <ActivityIndicator color="#FFFFFF" size="small" />
            )}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-medium"
            >
              {isSaving || uploading
                ? "Saving..."
                : loading
                  ? "Loading..."
                  : "Save"}
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
            <View className="items-center" style={{ marginBottom: mvs(20) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-background font-neueBold text-center"
              style={{ marginBottom: mvs(4) }}
            >
              You have unsaved changes
            </ScaledText>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(32) }}
            >
              Do you want to discard them?
            </ScaledText>
            <View style={{ gap: mvs(4) }} className="flex-row justify-center">
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
