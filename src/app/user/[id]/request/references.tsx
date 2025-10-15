import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";

const GAP = 14; // inter-image gap size in px
const MAX_IMAGES = 5;
const NUM_COLUMNS = 2;

type ReferenceMedia = {
  id: string;
  uri: string;
  type: "image" | "video";
  cloud?: string;
};

type AddTile = { id: string; isAdd: true };
type GridItem = ReferenceMedia | AddTile;

function to2Columns(media: GridItem[]) {
  // Returns array of rows, each row is array of items of length NUM_COLUMNS (or less for last row)
  const out: GridItem[][] = [];
  for (let i = 0; i < media.length; i += NUM_COLUMNS) {
    out.push(media.slice(i, i + NUM_COLUMNS));
  }
  return out;
}

export default function ReferencesStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const media = usePrivateRequestStore((s) => s.answers.referenceMedia) as ReferenceMedia[];
  const setReferences = usePrivateRequestStore((s) => s.setReferences);

  const canProceed = useMemo(() => media.length > 0, [media]);
  const canAddMore = media.length < MAX_IMAGES;

  const handlePick = async () => {
    // Only allow adding until MAX_IMAGES total
    const files = await pickFiles({
      mediaType: "image",
      allowsMultipleSelection: true,
      maxFiles: MAX_IMAGES - media.length,
      cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions("image"),
    });
    if (!files || files.length === 0) return;

    const locals: ReferenceMedia[] = files.slice(0, MAX_IMAGES - media.length).map((f: any) => ({
      id: f.uri,
      uri: f.uri,
      type: f.type === "video" ? "video" : "image",
    }));
    setReferences([...media, ...locals] as any);

    const uploaded = await uploadToCloudinary(
      files,
      cloudinaryService.getPortfolioUploadOptions("image")
    );
    setReferences(
      usePrivateRequestStore.getState().answers.referenceMedia.map((m) => {
        const match = uploaded.find((u) => u.uri === m.uri);
        return match?.cloudinaryResult?.secureUrl
          ? { ...m, cloud: match.cloudinaryResult.secureUrl }
          : m;
      })
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4">
        <Text className="text-foreground tat-body-2-med text-center mt-2 mb-6 px-4">
          Can you post some examples of tattoos that resemble the result you'd
          like?
        </Text>
        {media.length === 0 ? (
          // Initial upload box (existing UI)
          <View className="border-2 border-dashed border-error/70 rounded-2xl bg-primary/20 items-center py-10 mb-6">
            <SVGIcons.Upload className="w-5 h-5" />
            <TouchableOpacity
              onPress={handlePick}
              disabled={uploading}
              className="bg-primary rounded-full py-3 px-6 mt-3"
            >
              <Text className="text-foreground tat-body-1 font-neueBold">
                {uploading ? "Uploading..." : "Upload files"}
              </Text>
            </TouchableOpacity>
            <Text className="text-foreground/80 mt-6 text-center px-4">
              Fino a 5 foto, supporta JPG, PNG. Max size 5MB Fino a 2 video,
              supporta MOV, MP4, AVI. Max size 10MB
            </Text>
          </View>
        ) : (
          // Two-column grid layout for uploaded images and add image button
          <View
            className="mb-8 w-full"
            style={{
              flexDirection: "column",
              justifyContent: "flex-start",
              // prevent horizontal scrolling, wrap in a ScrollView if more than (MAX_IMAGES / NUM_COLUMNS) rows
            }}
          >
            {(() => {
              const gridItems: GridItem[] = [
                ...media,
                ...(canAddMore ? ([{ id: "__add__", isAdd: true }] as GridItem[]) : []),
              ];
              return to2Columns(gridItems);
            })().map(
              (row, rowIdx) => (
                <View
                  key={rowIdx}
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    marginBottom: rowIdx < Math.ceil((media.length + (canAddMore ? 1 : 0))/NUM_COLUMNS)-1 ? GAP : 0,
                  }}
                >
                  {row.map((item, colIdx) =>
                    ("isAdd" in item && item.isAdd) ? (
                      <TouchableOpacity
                        key="add"
                        onPress={handlePick}
                        disabled={uploading}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderStyle: "dashed",
                          borderColor: "#A62E2E",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(227, 31, 36, 0.12)",
                          marginRight: colIdx === 0 && row.length === 2 ? GAP : 0, // gap between columns
                        }}
                        accessibilityLabel="Add image"
                      >
                        {uploading ? (
                          <ActivityIndicator color="#A62E2E" size="small" />
                        ) : (
                          <>
                            <SVGIcons.Upload width={24} height={24} />
                            <Text
                              className="text-foreground"
                              style={{
                                color: "#fff",
                                marginTop: 10,
                                textAlign: "center",
                                fontSize: 14,
                                opacity: 0.8,
                              }}
                            >
                              Add image
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View
                        key={(item as ReferenceMedia).id}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          borderRadius: 16,
                          overflow: "hidden",
                          position: "relative",
                          backgroundColor: "#191415", // fallback
                          borderWidth: 1,
                          borderColor: "#31000044",
                          marginRight: colIdx === 0 && row.length === 2 ? GAP : 0, // gap between columns
                        }}
                      >
                        <Image
                          source={{ uri: (item as ReferenceMedia).cloud || (item as ReferenceMedia).uri }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            backgroundColor: "rgba(0,0,0,0.7)",
                            borderRadius: 99,
                            padding: 4,
                            zIndex: 2,
                          }}
                          accessibilityLabel="Remove image"
                          onPress={() => setReferences(media.filter((m) => m.id !== (item as ReferenceMedia).id))}
                          hitSlop={10}
                        >
                          <SVGIcons.Close className="w-4 h-4" color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )
                  )}
                  {row.length === 1 && (
                    <View style={{ flex: 1, aspectRatio: 1, marginLeft: GAP, opacity: 0 }} />
                  )}
                </View>
              )
            )}
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between px-6 py-4 bg-background absolute bottom-0 left-0 right-0 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-full border border-foreground px-6 py-4"
        >
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!canProceed}
          onPress={() => router.push(("/user/" + id + "/request/color") as any)}
          className={`rounded-full px-8 py-4 ${canProceed ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
