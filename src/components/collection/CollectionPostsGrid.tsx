import React, { useCallback } from "react";
import { View, TouchableOpacity } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { CollectionPostInterface } from "@/types/collection";
import CollectionPostCard from "@/components/collection/CollectionPostCard";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const REF_WIDTH = 375;
const GAP = Math.max(6, Math.round((8 * screenWidth) / REF_WIDTH));
const H_PADDING = Math.max(24, Math.round((32 * screenWidth) / REF_WIDTH));

interface CollectionPostsGridProps {
  posts: CollectionPostInterface[];
  editMode: boolean;
  onReorder: (data: CollectionPostInterface[]) => Promise<void> | void;
  onPostPress: (postId: string) => void;
  onDeletePost: (postId: string, caption: string) => void;
  onOpenAddModal: () => void;
}

const CollectionPostsGridComponent: React.FC<CollectionPostsGridProps> = ({
  posts,
  editMode,
  onReorder,
  onPostPress,
  onDeletePost,
  onOpenAddModal,
}) => {
  const NUM_COLUMNS = editMode ? 1 : 2;
  const POST_WIDTH = (screenWidth - H_PADDING - GAP) / NUM_COLUMNS;
  const layoutKey = editMode ? "one-col" : "two-col";

  const handleDragEnd = useCallback(
    ({ data }: { data: CollectionPostInterface[] }) => {
      onReorder(data);
    },
    [onReorder]
  );

  const renderPostItem = useCallback(
    ({
      item,
      drag,
      isActive,
      getIndex,
    }: RenderItemParams<CollectionPostInterface>) => {
      const index = getIndex();
      const col = index !== undefined ? index % NUM_COLUMNS : 0;
      const row = index !== undefined ? Math.floor(index / NUM_COLUMNS) : 0;

      const marginLeft = col === 0 ? 0 : GAP / 2;
      const marginRight = col === NUM_COLUMNS - 1 ? 0 : GAP / 2;
      const marginTop = row === 0 ? 0 : GAP;

      return (
        <ScaleDecorator key={item.postId}>
          <CollectionPostCard
            thumbnailUrl={item.thumbnailUrl}
            mediaUrl={item.media[0]?.mediaUrl}
            mediaType={item.media[0]?.mediaType}
            caption={item.caption}
            editMode={editMode}
            isActive={isActive}
            onPress={() => onPostPress(item.postId)}
            onDragHandlePressIn={editMode ? drag : undefined}
            onDeletePress={() =>
              onDeletePost(item.postId, item.caption || "")
            }
            width={POST_WIDTH}
            marginLeft={marginLeft}
            marginRight={marginRight}
            marginTop={marginTop}
            fixedHeight={editMode ? mvs(253) : undefined}
          />
        </ScaleDecorator>
      );
    },
    [NUM_COLUMNS, editMode, onDeletePost, onPostPress]
  );

  return (
    <DraggableFlatList
      key={layoutKey}
      data={posts}
      onDragEnd={handleDragEnd}
      keyExtractor={(item) => item.postId}
      renderItem={renderPostItem}
      numColumns={NUM_COLUMNS}
      ListHeaderComponent={
        editMode ? (
          <View
            style={{
              marginTop: GAP,
              marginBottom: GAP,
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={onOpenAddModal}
              activeOpacity={0.8}
              className="items-center justify-center border-2 border-dashed rounded-xl border-primary bg-primary/10"
              style={{
                width: POST_WIDTH,
                height: mvs(253),
              }}
            >
              <SVGIcons.AddRed width={s(32)} height={s(32)} />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="mt-3 text-foreground font-neueMedium"
              >
                Aggiungi nuovo tatuaggio
              </ScaledText>
            </TouchableOpacity>
          </View>
        ) : null
      }
      containerStyle={{
        flex: 1,
      }}
      contentContainerStyle={{
        paddingHorizontal: H_PADDING / 2,
        paddingBottom: 20,
      }}
      dragItemOverflow={true}
      activationDistance={editMode ? 0 : 999999}
      autoscrollThreshold={24}
    />
  );
};

export const CollectionPostsGrid = React.memo(CollectionPostsGridComponent);


