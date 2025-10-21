import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { mvs, s } from "@/utils/scale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

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
  const media = usePrivateRequestStore(
    (s) => s.answers.referenceMedia
  ) as ReferenceMedia[];
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

    const locals: ReferenceMedia[] = files
      .slice(0, MAX_IMAGES - media.length)
      .map((f: any) => ({
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

  const GAP = s(14); // inter-image gap size in px

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={{ paddingHorizontal: s(16) }}>
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground text-center font-montserratMedium"
            style={{
              marginTop: mvs(8),
              marginBottom: mvs(24),
              paddingHorizontal: s(16),
            }}
          >
            Can you post some examples of tattoos that resemble the result you'd
            like?
          </ScaledText>
          {media.length === 0 ? (
            // Initial upload box (existing UI)
            <View
              className="border-2 border-dashed border-error/70 rounded-2xl bg-primary/20 items-center"
              style={{ paddingVertical: mvs(40), marginBottom: mvs(24) }}
            >
              <SVGIcons.Upload width={s(32)} height={s(32)} />
              <TouchableOpacity
                onPress={handlePick}
                disabled={uploading}
                className="bg-primary rounded-full"
                style={{
                  paddingVertical: mvs(8),
                  paddingHorizontal: s(16),
                  marginTop: mvs(8),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueBold"
                >
                  {uploading ? "Uploading..." : "Upload files"}
                </ScaledText>
              </TouchableOpacity>
              <ScaledText
                allowScaling={false}
                variant="11"
                className="text-foreground/80 text-center"
                style={{ marginTop: mvs(24), paddingHorizontal: s(16) }}
              >
                Fino a 5 foto, supporta JPG, PNG. Max size 5MB Fino a 2 video,
                supporta MOV, MP4, AVI. Max size 10MB
              </ScaledText>
            </View>
          ) : (
            // Two-column grid layout for uploaded images and add image button
            <View
              className="w-full"
              style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                marginBottom: mvs(32),
              }}
            >
              {(() => {
                const gridItems: GridItem[] = [
                  ...media,
                  ...(canAddMore
                    ? ([{ id: "__add__", isAdd: true }] as GridItem[])
                    : []),
                ];
                return to2Columns(gridItems);
              })().map((row, rowIdx) => (
                <View
                  key={rowIdx}
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    marginBottom:
                      rowIdx <
                      Math.ceil(
                        (media.length + (canAddMore ? 1 : 0)) / NUM_COLUMNS
                      ) -
                        1
                        ? GAP
                        : 0,
                  }}
                >
                  {row.map((item, colIdx) =>
                    "isAdd" in item && item.isAdd ? (
                      <TouchableOpacity
                        key="add"
                        onPress={handlePick}
                        disabled={uploading}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          borderRadius: s(16),
                          borderWidth: 1.5,
                          borderStyle: "dashed",
                          borderColor: "#A62E2E",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(227, 31, 36, 0.12)",
                          marginRight:
                            colIdx === 0 && row.length === 2 ? GAP : 0, // gap between columns
                        }}
                        accessibilityLabel="Add image"
                      >
                        {uploading ? (
                          <ActivityIndicator color="#A62E2E" size="small" />
                        ) : (
                          <>
                            <SVGIcons.Upload width={s(24)} height={s(24)} />
                            <ScaledText
                              allowScaling={false}
                              variant="11"
                              className="text-foreground"
                              style={{
                                color: "#fff",
                                marginTop: mvs(10),
                                textAlign: "center",
                                opacity: 0.8,
                              }}
                            >
                              Add image
                            </ScaledText>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View
                        key={(item as ReferenceMedia).id}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          borderRadius: s(16),
                          overflow: "hidden",
                          position: "relative",
                          backgroundColor: "#191415", // fallback
                          borderWidth: 1,
                          borderColor: "#31000044",
                          marginRight:
                            colIdx === 0 && row.length === 2 ? GAP : 0, // gap between columns
                        }}
                      >
                        <Image
                          source={{
                            uri:
                              (item as ReferenceMedia).cloud ||
                              (item as ReferenceMedia).uri,
                          }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={{
                            position: "absolute",
                            top: s(6),
                            right: s(6),
                            backgroundColor: "rgba(0,0,0,0.7)",
                            borderRadius: 99,
                            padding: s(4),
                            zIndex: 2,
                          }}
                          accessibilityLabel="Remove image"
                          onPress={() =>
                            setReferences(
                              media.filter(
                                (m) => m.id !== (item as ReferenceMedia).id
                              )
                            )
                          }
                          hitSlop={s(10)}
                        >
                          <SVGIcons.Close
                            width={s(16)}
                            height={s(16)}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      </View>
                    )
                  )}
                  {row.length === 1 && (
                    <View
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        marginLeft: GAP,
                        opacity: 0,
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <NextBackFooter
          onBack={() => router.back()}
          onNext={() => router.push(`/user/${id}/request/color`)}
          nextLabel="Next"
          backLabel="Back"
          nextDisabled={!canProceed}
        />
      </ScrollView>
    </View>
  );
}
