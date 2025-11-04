import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
    fetchStudioDetails,
    updateStudioFAQs,
} from "@/services/studio.service";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    TouchableOpacity,
    View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { toast } from "sonner-native";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function StudioFAQsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [initialFaqs, setInitialFaqs] = useState<FAQ[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [tempQuestion, setTempQuestion] = useState("");
  const [tempAnswer, setTempAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Fetch current studio data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setIsFetching(true);
        const studio = await fetchStudioDetails(user.id);

        const faqData =
          studio.faqs?.map((faq: any, index: number) => ({
            id: faq.id || `faq-${index}`,
            question: faq.question,
            answer: faq.answer,
          })) || [];

        setFaqs(faqData);
        setInitialFaqs(JSON.parse(JSON.stringify(faqData)));
      } catch (error: any) {
        console.error("Error fetching studio:", error);
        toast.error(error.message || "Failed to load studio data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleAddFaq = () => {
    setEditingFaq(null);
    setTempQuestion("");
    setTempAnswer("");
    setModalVisible(true);
  };

  const handleEditFaq = (faq: FAQ) => {
    setEditingFaq(faq);
    setTempQuestion(faq.question);
    setTempAnswer(faq.answer);
    setModalVisible(true);
  };

  const handleSaveFaq = () => {
    if (tempQuestion.trim() === "" || tempAnswer.trim() === "") {
      return;
    }

    if (editingFaq) {
      // Update existing FAQ
      setFaqs((prev) =>
        prev.map((faq) =>
          faq.id === editingFaq.id
            ? { ...faq, question: tempQuestion, answer: tempAnswer }
            : faq
        )
      );
    } else {
      // Add new FAQ
      const newFaq: FAQ = {
        id: `faq-${Date.now()}`,
        question: tempQuestion,
        answer: tempAnswer,
      };
      setFaqs((prev) => [...prev, newFaq]);
    }

    setModalVisible(false);
    setTempQuestion("");
    setTempAnswer("");
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs((prev) => prev.filter((faq) => faq.id !== id));
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    JSON.stringify(faqs) !== JSON.stringify(initialFaqs);

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

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const result = await updateStudioFAQs(
        user.id,
        faqs.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
        }))
      );

      if (result.success) {
        toast.success("FAQs updated successfully!");
        setInitialFaqs(JSON.parse(JSON.stringify(faqs)));
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        toast.error(result.error || "Failed to update FAQs");
      }
    } catch (error: any) {
      console.error("Error updating FAQs:", error);
      toast.error(error.message || "Failed to update FAQs");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: mvs(120) }}
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
                disabled={isFetching}
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
                FAQs
              </ScaledText>
            </View>

            {/* Divider */}
            <View
              className="bg-gray"
              style={{ height: s(1), marginBottom: mvs(32) }}
            />

            {/* Content */}
            <View style={{ paddingHorizontal: s(24) }}>
              {/* Subtitle */}
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-foreground font-neueLight text-center"
                style={{ marginBottom: mvs(20) }}
              >
                Add a question and its answer to help visitors learn more about your
                studio and work. You can add upto 5 FAQs in your profile
              </ScaledText>

              {/* FAQs List */}
              {faqs.length > 0 && (
                <View style={{ gap: mvs(12) }}>
                  {faqs.map((faq) => (
                    <TouchableOpacity
                      key={faq.id}
                      className="rounded-xl border border-gray bg-tat-foreground flex-row items-center justify-between"
                      style={{
                        paddingVertical: mvs(10),
                        paddingHorizontal: s(13),
                        gap: s(10),
                      }}
                      onPress={() => handleEditFaq(faq)}
                      activeOpacity={0.8}
                      disabled={isFetching}
                    >
                      <View className="w-fit">
                        <SVGIcons.Faq width={s(12)} height={s(12)} />
                      </View>
                      <ScaledText
                        allowScaling={false}
                        variant="sm"
                        className="text-foreground font-montserratSemibold flex-1"
                      >
                        {faq.question}
                      </ScaledText>
                      <TouchableOpacity
                        onPress={() => handleDeleteFaq(faq.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        disabled={isFetching}
                      >
                        <SVGIcons.CloseGray width={s(10)} height={s(10)} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Add FAQ Button */}
              <TouchableOpacity
                onPress={handleAddFaq}
                disabled={isFetching}
                className="border border-dashed border-gray/50 rounded-xl items-center flex-row"
                style={{
                  paddingVertical: mvs(10),
                  paddingHorizontal: s(13),
                  gap: s(16),
                  marginTop: mvs(12),
                  opacity: isFetching ? 0.5 : 1,
                }}
              >
                <View
                  className="bg-primary rounded-full items-center justify-center"
                  style={{ width: s(18), height: s(18) }}
                >
                  <SVGIcons.Plus width={s(9)} height={s(9)} />
                </View>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratSemibold"
                >
                  Add Faq
                </ScaledText>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>

          {/* Save Button */}
          <View
            style={{
              paddingHorizontal: s(16),
              paddingBottom: mvs(32),
            }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading || isFetching || !hasUnsavedChanges}
              className="rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  isLoading || isFetching || !hasUnsavedChanges
                    ? "#6B2C2C"
                    : "#AD2E2E",
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueMedium"
              >
                {isLoading ? "Saving..." : "Save"}
              </ScaledText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Add/Edit FAQ Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-background/50">
          <View
            className="flex-1 bg-background rounded-t-3xl"
            style={{ marginTop: "auto", maxHeight: "100%" }}
          >
            {/* Modal Header */}
            <View
              className="border-b border-gray flex-row items-center justify-between relative bg-primary/30"
              style={{
                paddingBottom: mvs(20),
                paddingTop: mvs(60),
                paddingHorizontal: s(20),
              }}
            >
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="rounded-full bg-foreground/20 items-center justify-center"
                style={{ width: s(30), height: s(30) }}
              >
                <SVGIcons.Close className="w-8 h-8" />
              </TouchableOpacity>
              <View className="flex-row items-center justify-center">
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueBold"
                >
                  {editingFaq ? "Edit FAQ" : "Add FAQ"}
                </ScaledText>
              </View>
              <View style={{ height: mvs(30), width: mvs(30) }} />
            </View>

            {/* Modal Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: s(20),
                paddingTop: mvs(24),
                paddingBottom: mvs(120),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-foreground font-neueLight text-center"
                style={{ marginBottom: mvs(20) }}
              >
                Add a question and its answer to help visitors learn more about
                your studio and work.
              </ScaledText>

              {/* Question Input */}
              <View style={{ marginBottom: mvs(24) }}>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratSemibold mb-2"
                >
                  Question
                  <ScaledText variant="sm" className="text-error">
                    *
                  </ScaledText>
                </ScaledText>
                <ScaledTextInput
                  containerClassName="rounded-xl border border-gray"
                  className="text-foreground"
                  placeholder="Enter your question"
                    
                  value={tempQuestion}
                  onChangeText={setTempQuestion}
                />
              </View>

              {/* Answer Input */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratSemibold mb-2"
                >
                  Rispondi a questa domanda*
                  <ScaledText variant="sm" className="text-error">
                    *
                  </ScaledText>
                </ScaledText>
                <ScaledTextInput
                  containerClassName="rounded-xl border border-gray"
                  className="text-foreground"
                  placeholder="Enter your answer"
                    
                  value={tempAnswer}
                  onChangeText={setTempAnswer}
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: mvs(120), textAlignVertical: "top" }}
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View
              className="absolute bottom-0 left-0 right-0 bg-background border-t border-gray/20"
              style={{
                paddingHorizontal: s(20),
                paddingTop: mvs(16),
                paddingBottom: mvs(32),
              }}
            >
              <TouchableOpacity
                onPress={handleSaveFaq}
                disabled={
                  tempQuestion.trim() === "" || tempAnswer.trim() === ""
                }
                className="rounded-full items-center justify-center"
                style={{
                  backgroundColor:
                    tempQuestion.trim() === "" || tempAnswer.trim() === ""
                      ? "#6B2C2C"
                      : "#AD2E2E",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueMedium"
                >
                  {editingFaq ? "Update FAQ" : "Add FAQ"}
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              You have unsaved changes in FAQs
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
    </View>
  );
}
