import React from "react";
import EditCollectionNameModal from "@/components/collection/EditCollectionNameModal";
import AddPostsModal from "@/components/collection/AddPostsModal";
import DeleteConfirmModal from "@/components/collection/DeleteConfirmModal";
import DeleteCollectionModal from "@/components/collection/DeleteCollectionModal";
import { CollectionPostInterface } from "@/types/collection";

interface CollectionModalsProps {
  showEditName: boolean;
  editName: string;
  onEditNameChange: (value: string) => void;
  onEditNameClose: () => void;
  onEditNameSave: () => Promise<void> | void;

  showSelectPosts: boolean;
  allUserPosts: { id: string; caption?: string; thumbnailUrl?: string }[];
  selectedPostIds: Set<string>;
  onTogglePostSelect: (postId: string) => void;
  onCloseSelect: () => void;
  onConfirmAdd: () => Promise<void> | void;
  collectionId?: string;

  showDeletePost: boolean;
  deletingPost: boolean;
  postToDelete: { id: string; caption: string } | null;
  onCancelDeletePost: () => void;
  onConfirmDeletePost: () => Promise<void> | void;

  showDeleteCollection: boolean;
  deletingCollection: boolean;
  collectionName?: string;
  onCancelDeleteCollection: () => void;
  onConfirmDeleteCollection: () => Promise<void> | void;
}

const CollectionModalsComponent: React.FC<CollectionModalsProps> = ({
  showEditName,
  editName,
  onEditNameChange,
  onEditNameClose,
  onEditNameSave,
  showSelectPosts,
  allUserPosts,
  selectedPostIds,
  onTogglePostSelect,
  onCloseSelect,
  onConfirmAdd,
  collectionId,
  showDeletePost,
  deletingPost,
  postToDelete,
  onCancelDeletePost,
  onConfirmDeletePost,
  showDeleteCollection,
  deletingCollection,
  collectionName,
  onCancelDeleteCollection,
  onConfirmDeleteCollection,
}) => {
  return (
    <>
      <EditCollectionNameModal
        visible={showEditName}
        value={editName}
        onChangeValue={onEditNameChange}
        onCancel={onEditNameClose}
        onSave={onEditNameSave}
      />

      <AddPostsModal
        visible={showSelectPosts}
        items={allUserPosts as any}
        selectedIds={selectedPostIds}
        onToggle={onTogglePostSelect}
        onClose={onCloseSelect}
        onConfirm={onConfirmAdd}
        collectionId={collectionId}
      />

      <DeleteConfirmModal
        visible={showDeletePost}
        caption={postToDelete?.caption}
        onCancel={onCancelDeletePost}
        onConfirm={onConfirmDeletePost}
      />

      <DeleteCollectionModal
        visible={showDeleteCollection}
        collectionName={collectionName}
        onCancel={onCancelDeleteCollection}
        onConfirm={onConfirmDeleteCollection}
        deleting={deletingCollection}
      />
    </>
  );
};

export const CollectionModals = React.memo(CollectionModalsComponent);


