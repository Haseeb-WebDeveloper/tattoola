import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import StudioStepHeader from "@/components/ui/StudioStepHeader";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { saveStudioSetup } from "@/services/studio.service";
import { useStudioSetupStore } from "@/stores/studioSetupStore";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { toast } from "sonner-native";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function StudioStep8() {
  const { user } = useAuth();
  const {
    step1,
    step2,
    step3,
    step4,
    step5,
    step6,
    step7,
    step8,
    updateStep8,
    setCurrentStep,
    totalSteps,
    resetStore,
  } = useStudioSetupStore();

  const [faqs, setFaqs] = useState<FAQ[]>(
    step8.faqs?.map((faq, index) => ({
      id: `faq-${index}`,
      question: faq.question,
      answer: faq.answer,
    })) || []
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [tempQuestion, setTempQuestion] = useState("");
  const [tempAnswer, setTempAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCurrentStep(8);
  }, []);

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

  const handleNext = async () => {
    if (!user?.id) {
      toast.error("User not found. Please log in again.");
      return;
    }

    // Validate required fields
    if (!step2.logoUrl) {
      toast.error("Please upload a studio logo");
      router.push("/settings/studio/step-2" as any);
      return;
    }

    if (
      !step3.name ||
      !step3.province ||
      !step3.municipality ||
      !step3.address
    ) {
      toast.error("Please complete studio information");
      router.push("/settings/studio/step-3" as any);
      return;
    }

    if (step6.styleIds.length === 0) {
      toast.error("Please select at least one style");
      router.push("/settings/studio/step-6" as any);
      return;
    }

    if (step7.serviceIds.length === 0) {
      toast.error("Please select at least one service");
      router.push("/settings/studio/step-7" as any);
      return;
    }

    // Save FAQs to store
    updateStep8({
      faqs: faqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
    });

    setIsSaving(true);

    try {
      // Save all studio data to database
      const result = await saveStudioSetup(
        user.id,
        step1,
        step2,
        step3,
        step4,
        step5,
        step6,
        step7,
        {
          faqs: faqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
          })),
        }
      );

      if (result.success) {
        toast.success("Studio setup completed successfully! 🎉");

        // Clear the store
        resetStore();

        // Navigate to studio index
        setTimeout(() => {
          router.push("/settings/studio" as any);
        }, 500);
      } else {
        toast.error(result.error || "Failed to save studio. Please try again.");
      }
    } catch (error: any) {
      console.error("Error saving studio:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: mvs(120),
        }}
      >
        {/* Header */}
        <StudioStepHeader
          currentStep={8}
          totalSteps={8}
          stepName="FAQs"
          icon={<SVGIcons.Faq width={s(19)} height={s(19)} />}
        />

        {/* Content */}
        <View style={{ paddingHorizontal: s(24) }}>
          {/* Subtitle */}
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground font-neueLight text-center"
            style={{ marginBottom: mvs(20) }}
          >
            Add a question and its answer to help visitors learn more about your
            studio and work. You can add upto 5 FAQs in your profile
          </ScaledText>

          {/* FAQs List */}
          {faqs.length > 0 && (
            <View style={{ gap: mvs(12), }}>
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
            className="border border-dashed border-gray/50 rounded-xl items-center  flex-row"
            style={{
              paddingVertical: mvs(10),
              paddingHorizontal: s(13),
              gap: s(16),
              marginTop: mvs(12),
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

      {/* Footer - Fixed at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#000",
        }}
      >
        {isSaving ? (
          <View
            style={{
              paddingHorizontal: s(16),
              paddingBottom: mvs(32),
              paddingTop: mvs(16),
            }}
          >
            <View
              className="rounded-full items-center justify-center flex-row bg-primary"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                gap: s(8),
              }}
            >
              <ActivityIndicator color="#FFFFFF" size="small" />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueSemibold"
              >
                Saving...
              </ScaledText>
            </View>
          </View>
        ) : (
          <NextBackFooter
            onNext={handleNext}
            nextDisabled={isSaving}
            nextLabel="Complete"
            onBack={handleBack}
          />
        )}
      </View>

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
                  variant="lg"
                  className="text-foreground font-neueSemibold"
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
                variant="md"
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
                  style={{ fontSize: s(12) }}
                  placeholder="Enter your question"
                  placeholderTextColor="#A49A99"
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
                  placeholderTextColor="#A49A99"
                  value={tempAnswer}
                  onChangeText={setTempAnswer}
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: mvs(120), textAlignVertical: "top", fontSize: s(12) }}
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
                  className="text-foreground font-neueSemibold text-nowrap"
                >
                  {editingFaq ? "Update FAQ" : "Add FAQ "}
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
