import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { cloudinaryService } from "@/services/cloudinary.service";
import LocationPicker from "@/components/shared/LocationPicker";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import * as DocumentPicker from "expo-document-picker";

export default function BusinessInfoSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [artistId, setArtistId] = useState<string | null>(null);

  // Editable fields
  const [businessName, setBusinessName] = useState<string>("");
  const [studioAddress, setStudioAddress] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{
    name: string;
    size: number;
    uri: string;
  } | null>(null);

  // Location fields
  const [primaryProvinceId, setPrimaryProvinceId] = useState<string | null>(null);
  const [primaryMunicipalityId, setPrimaryMunicipalityId] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("Not set");

  // Initial snapshot for dirty check
  const [initial, setInitial] = useState({
    businessName: "",
    studioAddress: "",
    website: "",
    phone: "",
    certificateUrl: null as string | null,
    provinceId: null as string | null,
    municipalityId: null as string | null,
  });

  const hasUnsavedChanges = useMemo(() => {
    return (
      businessName.trim() !== initial.businessName.trim() ||
      studioAddress.trim() !== initial.studioAddress.trim() ||
      website.trim() !== initial.website.trim() ||
      phone.trim() !== initial.phone.trim() ||
      certificateUrl !== initial.certificateUrl ||
      primaryProvinceId !== initial.provinceId ||
      primaryMunicipalityId !== initial.municipalityId
    );
  }, [businessName, studioAddress, website, phone, certificateUrl, primaryProvinceId, primaryMunicipalityId, initial]);

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
        
        // Set selected document if certificate exists
        if (ap.certificateUrl) {
          setSelectedDocument({
            name: ap.certificateUrl.split("/").pop() || "Certificate",
            size: 0,
            uri: ap.certificateUrl,
          });
        }

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
            setPrimaryProvinceId(provinceId);
            setPrimaryMunicipalityId(municipalityId);
          } else {
            setLocationLabel("Not set");
          }
        } else {
          setLocationLabel("Not set");
        }

        // Set initial state
        setInitial({
          businessName: ap.businessName || "",
          studioAddress: ap.studioAddress || "",
          website: ap.website || "",
          phone: ap.phone || "",
          certificateUrl: ap.certificateUrl || null,
          provinceId: provinceId,
          municipalityId: municipalityId,
        });
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
      setUploading(true);
      
      // Pick document (PDF, DOC, DOCX, etc.)
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const file = result.assets[0];
      
      // Check file size (10MB limit for documents)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size && file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        setUploading(false);
        return;
      }

      // Set selected document for preview
      setSelectedDocument({
        name: file.name || "Document",
        size: file.size || 0,
        uri: file.uri,
      });

      // Upload to Cloudinary using the service method
      const uploadOptions = cloudinaryService.getCertificateUploadOptions();
      const uploadResult = await cloudinaryService.uploadFile(
        {
          uri: file.uri,
          type: file.mimeType || "application/pdf",
          fileName: file.name || "certificate.pdf",
        },
        uploadOptions
      );
      
      const certificateUrl = uploadResult.secureUrl;
      setCertificateUrl(certificateUrl);
      
      toast.success("Certificate uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading certificate:", error);
      toast.error(error.message || "Failed to upload certificate");
      setSelectedDocument(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCertificate = () => {
    setSelectedDocument(null);
    setCertificateUrl(null);
  };

  const handleSave = async () => {
    if (!artistId || !user?.id) {
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
      // Update artist profile
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

      // Update primary location if changed
      if (primaryProvinceId && primaryMunicipalityId) {
        // Check if location changed
        if (
          primaryProvinceId !== initial.provinceId ||
          primaryMunicipalityId !== initial.municipalityId
        ) {
          // Update primary user location
          const { data: existingLocation } = await supabase
            .from("user_locations")
            .select("id")
            .eq("userId", user.id)
            .eq("isPrimary", true)
            .maybeSingle();

          if (existingLocation) {
            // Update existing primary location
            const { error: updateError } = await supabase
              .from("user_locations")
              .update({
                provinceId: primaryProvinceId,
                municipalityId: primaryMunicipalityId,
              })
              .eq("id", existingLocation.id);
            if (updateError) throw updateError;
          } else {
            // Create new primary location
            const { error: insertError } = await supabase
              .from("user_locations")
              .insert({
                userId: user.id,
                provinceId: primaryProvinceId,
                municipalityId: primaryMunicipalityId,
                isPrimary: true,
              });
            if (insertError) throw insertError;
          }
        }
      }

      await clearProfileCache(user.id);
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
          
        editable={!loading && !isSaving && !uploading}
        keyboardType={keyboardType}
        containerClassName=""
        className="text-foreground font-neueMedium"
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
            className="text-white font-neueSemibold"
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

          {/* Location (editable) */}
          <View style={{ marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat font-montserratSemibold"
              style={{ marginBottom: mvs(8) }}
            >
              Posizione primaria
            </ScaledText>
            <TouchableOpacity
              onPress={() => setShowLocationPicker(true)}
              disabled={loading || isSaving}
              className="rounded-xl border border-gray"
              style={{
                backgroundColor: "#100C0C",
                paddingHorizontal: s(16),
                paddingVertical: mvs(12),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className={locationLabel === "Not set" ? "text-[#A49A99]" : "text-foreground font-montserratMedium"}
              >
                {loading ? "Loading..." : locationLabel}
              </ScaledText>
            </TouchableOpacity>
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
            
            {/* Upload area */}
            <View
              className="rounded-2xl items-center bg-primary/20 border-dashed border-error/70"
              style={{
                paddingVertical: mvs(24),
                paddingHorizontal: s(16),
                borderWidth: s(1),
                marginBottom: selectedDocument ? mvs(12) : 0,
              }}
            >
              <SVGIcons.Upload width={s(42)} height={s(42)} />
              <TouchableOpacity
                onPress={handlePickCertificate}
                disabled={uploading || loading || isSaving}
                className="bg-primary text-background rounded-full"
                style={{
                  paddingVertical: mvs(8),
                  paddingHorizontal: s(20),
                  borderRadius: s(70),
                  marginTop: mvs(12),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueSemibold"
                >
                  {uploading ? "Uploading..." : "Upload Certificate"}
                </ScaledText>
              </TouchableOpacity>
              <ScaledText
                allowScaling={false}
                variant="11"
                className="text-gray text-center font-neueSemibold"
                style={{ marginTop: mvs(12) }}
              >
                Supporta PDF, DOC, DOCX. Max size 10MB
              </ScaledText>
            </View>

            {/* Document preview */}
            {selectedDocument && (
              <View
                className="bg-primary/10 rounded-lg border border-primary/30"
                style={{
                  paddingHorizontal: mvs(16),
                  paddingVertical: mvs(10),
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <SVGIcons.Certificate width={s(18)} height={s(18)} />
                <View style={{ marginLeft: s(12), flex: 1 }}>
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueSemibold"
                    numberOfLines={1}
                  >
                    {selectedDocument.name}
                  </ScaledText>
                </View>
                <TouchableOpacity
                  onPress={handleRemoveCertificate}
                  style={{
                    padding: s(4),
                    marginLeft: s(8),
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <SVGIcons.CloseGray width={s(12)} height={s(12)} />
                </TouchableOpacity>
              </View>
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
              className="text-foreground font-neueMedium"
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

      {/* Location Picker */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        initialProvinceId={primaryProvinceId}
        initialMunicipalityId={primaryMunicipalityId}
        onSelect={({ province, provinceId, municipality, municipalityId }) => {
          setPrimaryProvinceId(provinceId);
          setPrimaryMunicipalityId(municipalityId);
          setLocationLabel(`${municipality}, ${province}`);
          setShowLocationPicker(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}
