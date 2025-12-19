import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { ms, mvs, s } from "@/utils/scale";
import React, { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ConversationMenuModalsProps = {
  visible: boolean;
  onClose: () => void;
  peerUsername: string;
  onReport: (reason: string) => void;
  onBlock: () => void;
  onDelete: () => void;
};

type ModalState = "menu" | "report" | "block" | "delete" | null;

const ConversationMenuModals = React.memo(function ConversationMenuModals({
  visible,
  onClose,
  peerUsername,
  onReport,
  onBlock,
  onDelete,
}: ConversationMenuModalsProps) {
  const [modalState, setModalState] = useState<ModalState>("menu");
  const [reportReason, setReportReason] = useState("");

  const handleClose = useCallback(() => {
    // Reset state
    setModalState("menu");
    setReportReason("");
    onClose();
  }, [onClose]);

  const handleReportSubmit = useCallback(() => {
    if (reportReason.trim()) {
      onReport(reportReason.trim());
      handleClose();
    }
  }, [reportReason, onReport, handleClose]);

  const handleBlockConfirm = useCallback(() => {
    onBlock();
    handleClose();
  }, [onBlock, handleClose]);

  const handleDeleteConfirm = useCallback(() => {
    onDelete();
    handleClose();
  }, [onDelete, handleClose]);

  // Render menu options
  const renderMenuContent = useMemo(
    () => (
      <View
        style={{
          backgroundColor: "#000000",
          borderTopLeftRadius: s(20),
          borderTopRightRadius: s(20),
          width: s(342),
          overflow: "hidden",
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 0,
          borderColor: "#FFFFFF",
        }}
      >
        {/* Handle Indicator */}
        <View
          className="items-center"
          style={{ paddingTop: mvs(12), paddingBottom: mvs(16) }}
        >
          <View
            style={{
              width: s(40),
              height: mvs(4),
              backgroundColor: "#FFFFFF",
              borderRadius: s(2),
            }}
          />
        </View>

        {/* Report Option */}
        <TouchableOpacity
          onPress={() => setModalState("report")}
          className="flex-row items-center justify-between"
          style={{
            paddingHorizontal: s(24),
            paddingVertical: mvs(18),
            borderBottomWidth: 0.5,
            borderBottomColor: "#333",
          }}
        >
          <View className="flex-row items-center" style={{ gap: s(10) }}>
            <View className="items-center justify-center">
              <SVGIcons.Error width={s(14)} height={s(14)} />
            </View>
            <ScaledText variant="md" className="text-foreground font-[600]">
              Segnala
            </ScaledText>
          </View>
          <SVGIcons.ChevronRight width={s(12)} height={s(12)} />
        </TouchableOpacity>

        {/* Block Option */}
        <TouchableOpacity
          onPress={() => setModalState("block")}
          className="flex-row items-center justify-between"
          style={{
            paddingHorizontal: s(24),
            paddingVertical: mvs(18),
            borderBottomWidth: 0.5,
            borderBottomColor: "#333",
          }}
        >
          <View className="flex-row items-center" style={{ gap: s(10) }}>
            <View className="items-center justify-center">
              <SVGIcons.Stop width={s(14)} height={s(14)} />
            </View>
            <ScaledText variant="md" className="text-foreground font-[600]">
              Blocca
            </ScaledText>
          </View>
          <SVGIcons.ChevronRight width={s(12)} height={s(12)} />
        </TouchableOpacity>

        {/* Delete Option */}
        <TouchableOpacity
          onPress={() => setModalState("delete")}
          className="flex-row items-center justify-between"
          style={{
            paddingHorizontal: s(24),
            paddingVertical: mvs(18),
          }}
        >
          <View className="flex-row items-center" style={{ gap: s(10) }}>
            <View className="items-center justify-center">
              <SVGIcons.Delete width={s(14)} height={s(14)} />
            </View>
            <ScaledText variant="md" className="text-foreground font-[600]">
              Elimina
            </ScaledText>
          </View>
          <SVGIcons.ChevronRight width={s(12)} height={s(12)} />
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={{ height: mvs(40) }} />
      </View>
    ),
    []
  );

  // Render report form
  const renderReportContent = useMemo(
    () => (
      <View
        style={{
          backgroundColor: "#000000",
          borderTopLeftRadius: s(20),
          borderTopRightRadius: s(20),
          width: s(342),
          // maxHeight: "90%",
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 0,
          borderColor: "#FFFFFF",
        }}
      >
        {/* Handle Indicator */}
        <View
          className="items-center"
          style={{ paddingTop: mvs(12), paddingBottom: mvs(16) }}
        >
          <View
            style={{
              width: s(40),
              height: mvs(4),
              backgroundColor: "#FFFFFF",
              borderRadius: s(2),
            }}
          />
        </View>

        <View
          style={{
            paddingHorizontal: s(24),
            paddingTop: mvs(8),
            paddingBottom: mvs(40),
          }}
        >
          {/* Warning Icon */}
          <View
            className="flex-row items-center justify-center self-center"
            style={{
              marginBottom: mvs(24),
              gap: s(8),
            }}
          >
            <SVGIcons.Error width={s(14)} height={s(14)} />
            <ScaledText
              variant="lg"
              className="text-foreground font-neueBold text-center"
            >
              Segnala
            </ScaledText>
          </View>

          <ScaledText
            variant="md"
            className="text-foreground font-montserratMedium text-center"
            style={{
              marginBottom: mvs(6),
            }}
          >
            Vuoi segnalare @{peerUsername}?
          </ScaledText>

          <ScaledText
            variant="11"
            className="text-gray font-neueMedium text-center"
            style={{
              marginBottom: mvs(24),
            }}
          >
            Il tuo messaggio verrà ricevuto e letto solo dallo staff di Tattoola
            che analizzerà la tua segnalazione in base al regolamento
          </ScaledText>

          <TextInput
            value={reportReason}
            onChangeText={setReportReason}
            placeholder="Descrivi qui il problema..."
            placeholderTextColor="rgba(164, 154, 153, 0.6)"
            multiline
            textAlignVertical="top"
            style={{
              fontSize: ms(14),
              lineHeight: mvs(20),
              minHeight: mvs(140),
              paddingHorizontal: s(14),
              paddingTop: mvs(10),
              paddingBottom: mvs(14),
              borderRadius: s(12),
              marginBottom: mvs(24),
              backgroundColor: "#100C0C",
              borderWidth: s(0.5),
              borderColor: "rgba(164, 154, 153, 0.4)",
              color: "#fff",
              fontFamily: "montserratMedium",
            }}
          />

          <TouchableOpacity
            onPress={handleReportSubmit}
            disabled={!reportReason.trim()}
            className="bg-primary rounded-full items-center w-full"
            style={{
              paddingVertical: mvs(10),
              paddingHorizontal: s(32),
              opacity: reportReason.trim() ? 1 : 0.5,
            }}
          >
            <ScaledText variant="md" className="font-neueBold text-foreground">
              Invia la tua segnalazione
            </ScaledText>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [reportReason, peerUsername, handleReportSubmit]
  );

  // Render block confirmation
  const renderBlockContent = useMemo(
    () => (
      <View
        style={{
          backgroundColor: "#FFF",
          borderTopLeftRadius: s(20),
          borderTopRightRadius: s(20),
          width: "100%",
          paddingBottom: mvs(32),
        }}
      >
        {/* Handle Indicator */}
        <View
          className="items-center"
          style={{ paddingTop: mvs(12), paddingBottom: mvs(16) }}
        >
          <View
            style={{
              width: s(40),
              height: mvs(4),
              backgroundColor: "#CCCCCC",
              borderRadius: s(2),
            }}
          />
        </View>

        <View style={{ paddingHorizontal: s(24) }}>
          {/* Title with Icon */}
          <View
            className="flex-row items-center justify-center self-center"
            style={{
              marginBottom: mvs(24),
              gap: s(8),
            }}
          >
            <SVGIcons.Warning width={s(32)} height={s(32)} />
          </View>
          <ScaledText
            variant="lg"
            className="font-neueBold text-center"
            style={{ color: "#000000", marginBottom: mvs(4) }}
          >
            Do you really want to block this person?
          </ScaledText>

          <ScaledText
            variant="md"
            className="font-montserratMedium text-center"
            style={{
              marginBottom: mvs(32),
              color: "#000000",
            }}
          >
            Once blocked, you will not be able to receive or send messages.
          </ScaledText>

          <View className="flex-row" style={{ gap: s(12) }}>
            <TouchableOpacity
              onPress={handleBlockConfirm}
              className="flex-1 items-center justify-center  rounded-full"
              style={{
                paddingVertical: mvs(10),
                borderWidth: mvs(2),
                borderColor: "#AE0E0E",
              }}
            >
              <ScaledText variant="md" className="font-neueBold text-[#AE0E0E]">
                Yes
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClose}
              className="flex-1 items-center justify-center"
              style={{
                borderRadius: s(100),
                paddingVertical: mvs(10),
              }}
            >
              <ScaledText variant="md" className="font-neueBold opacity-70">
                No
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [handleClose, handleBlockConfirm]
  );

  // Render delete confirmation
  const renderDeleteContent = useMemo(
    () => (
      <View
        style={{
          backgroundColor: "#FFF",
          borderTopLeftRadius: s(20),
          borderTopRightRadius: s(20),
          width: "100%",
          paddingBottom: mvs(32),
        }}
      >
        {/* Handle Indicator */}
        <View
          className="items-center"
          style={{ paddingTop: mvs(12), paddingBottom: mvs(16) }}
        >
          <View
            style={{
              width: s(40),
              height: mvs(4),
              backgroundColor: "#CCCCCC",
              borderRadius: s(2),
            }}
          />
        </View>

        <View style={{ paddingHorizontal: s(24) }}>
          {/* Title with Icon */}
          <View
            className="flex-row items-center justify-center self-center "
            style={{
              marginBottom: mvs(16),
              gap: s(8),
            }}
          >
            <SVGIcons.Warning width={s(32)} height={s(32)} />
          </View>
          <ScaledText
            variant="lg"
            className="font-neueBold text-center"
            style={{ color: "#000000", marginBottom: mvs(4) }}
          >
            Are you sure you want to delete this chat?
          </ScaledText>

          <ScaledText
            variant="md"
            className="font-montserratMedium text-center"
            style={{
              marginBottom: mvs(32),
              color: "#000000",
            }}
          >
            Once deleted, the chat won’t be available
          </ScaledText>

          <View className="flex-row" style={{ gap: s(12) }}>
            <TouchableOpacity
              onPress={handleDeleteConfirm}
              className="flex-1 items-center justify-center bg-primary rounded-full"
              style={{
                paddingVertical: mvs(10),
                borderWidth: mvs(2),
                borderColor: "#AE0E0E",
              }}
            >
              <ScaledText
                variant="md"
                className="font-neueBold text-foreground"
              >
                Yes
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClose}
              className="flex-1 items-center justify-center border-tat"
              style={{
                borderRadius: s(100),
                paddingVertical: mvs(10),
                borderWidth: s(1),
              }}
            >
              <ScaledText variant="md" className="font-neueBold opacity-70">
                No
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [handleClose, handleDeleteConfirm]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          className="flex-1 justify-end items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {modalState === "menu"
              ? renderMenuContent
              : modalState === "report"
                ? renderReportContent
                : modalState === "block"
                  ? renderBlockContent
                  : modalState === "delete"
                    ? renderDeleteContent
                    : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default ConversationMenuModals;
