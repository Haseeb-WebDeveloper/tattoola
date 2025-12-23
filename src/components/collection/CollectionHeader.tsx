import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { isSystemCollection } from "@/utils/collection.utils";
import { mvs, s } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";

interface AuthorInfo {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface CollectionHeaderProps {
  collectionName: string;
  postsCount: number;
  author?: AuthorInfo | null;
  viewerFallback?: AuthorInfo | null;
  isOwner: boolean;
  editMode: boolean;
  onBack: () => void;
  onToggleEditMode: () => void;
  onEditName: () => void;
  onDeleteCollection: () => void;
}

const CollectionHeaderComponent: React.FC<CollectionHeaderProps> = ({
  collectionName,
  postsCount,
  author,
  viewerFallback,
  isOwner,
  editMode,
  onBack,
  onToggleEditMode,
  onEditName,
  onDeleteCollection,
}) => {
  const effectiveAuthor = author || viewerFallback || {};
  const avatarUri =
    effectiveAuthor.avatar ||
    `https://api.dicebear.com/7.x/initials/png?seed=${
      effectiveAuthor.firstName?.split(" ")[0] || "A"
    }`;
  
  // Check collection type
  const collectionNameLower = collectionName?.toLowerCase() || "";
  const isTuttiCollection = collectionNameLower === "tutti";
  const isSystemCol = isSystemCollection(collectionName);
  // Preferiti can edit posts but not name/delete. Tutti cannot edit at all.
  const canEditPosts = isOwner && !isTuttiCollection; // Allow edit mode for Preferiti
  const canEditName = isOwner && !isSystemCol; // Cannot edit name for any system collection
  const canDeleteCollection = isOwner && !isSystemCol; // Cannot delete any system collection

  return (
    <>
      <View className="flex-row items-center justify-between px-4 pt-4 ">
        <TouchableOpacity
          onPress={onBack}
          className="items-center justify-center w-8 h-8 rounded-full bg-foreground/20"
        >
          <SVGIcons.ChevronLeft width={16} height={16} />
        </TouchableOpacity>

        <View className="items-center flex-1">
          <View className="flex-row items-center justify-center">
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-neueSemibold"
              style={{
                lineHeight: mvs(20),
                borderBottomWidth: editMode ? mvs(0.5) : 0,
                borderBottomColor: editMode ? undefined : "transparent",
              }}
            >
              {TrimText(collectionName, 15)}
            </ScaledText>
            {isOwner && editMode && !isSystemCol && (
              <TouchableOpacity
                onPress={onEditName}
                style={{ marginLeft: s(8) }}
              >
                <SVGIcons.Edit width={16} height={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {canEditPosts && !(editMode && collectionNameLower === "preferiti") && (
          <TouchableOpacity
            onPress={editMode ? onDeleteCollection : onToggleEditMode}
            style={{
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {editMode ? (
              canDeleteCollection ? (
                <SVGIcons.Trash width={20} height={20} />
              ) : (
                <SVGIcons.Edit width={20} height={20} />
              )
            ) : (
              <SVGIcons.Edit width={20} height={20} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-col items-center pb-4 mt-1">
        <View className="flex-row items-center">
          <Image
            source={{
              uri: avatarUri,
            }}
            className="w-5 h-5 mr-2 border rounded-full border-foreground"
          />
          <ScaledText
            variant="sm"
            className="text-foreground font-montserratLight"
          >
            {effectiveAuthor.firstName || "Sconosciuto"}{" "}
            {effectiveAuthor.lastName || ""}
          </ScaledText>
        </View>

        <View className="flex-row items-center">
          <ScaledText
            variant="sm"
            className="text-foreground font-montserratLight"
          >
            {postsCount} design
          </ScaledText>
        </View>
      </View>
    </>
  );
};

export const CollectionHeader = React.memo(CollectionHeaderComponent);


