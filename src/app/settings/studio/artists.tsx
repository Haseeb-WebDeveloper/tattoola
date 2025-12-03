import {
  ArtistSearchResultCard,
  StudioArtistCardSkeleton,
  StudioMemberCard,
  StudioSearchBar,
} from "@/components/studio";
import { CustomToast } from "@/components/ui/CustomToast";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  getStudioMembers,
  inviteArtistToStudio,
  removeStudioMember,
  resendInvitation,
  SearchArtistResult,
  searchArtistsForInvite,
  StudioMember,
} from "@/services/studio.invitation.service";
import { fetchArtistStudio } from "@/services/studio.service";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

export default function StudioArtistsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studioId, setStudioId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchArtistResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [members, setMembers] = useState<{
    accepted: StudioMember[];
    pending: StudioMember[];
    rejected: StudioMember[];
  }>({ accepted: [], pending: [], rejected: [] });
  const [inviting, setInviting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<StudioMember | null>(
    null
  );
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadStudio = async () => {
      try {
        setLoading(true);
        const studio = await fetchArtistStudio(user.id);
        if (studio) {
          setStudioId(studio.id);
          await loadMembers(studio.id);
        } else {
          toast.error("Studio non trovato");
          router.back();
        }
      } catch (error: any) {
        console.error("Error loading studio:", error);
        toast.error(error.message || "Impossibile caricare lo studio");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadStudio();
  }, [user?.id]);

  const loadMembers = async (id: string) => {
    try {
      const result = await getStudioMembers(id, user!.id);
      if (result.data) {
        setMembers(result.data);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error: any) {
      console.error("Error loading members:", error);
      toast.error(error.message || "Impossibile caricare i membri");
    }
  };

  useEffect(() => {
    if (!studioId || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await searchArtistsForInvite(searchQuery, studioId);
        if (result.data) {
          setSearchResults(result.data);
        } else if (result.error) {
          toast.error(result.error);
        }
      } catch (error: any) {
        console.error("Error searching artists:", error);
        toast.error(error.message || "Impossibile cercare gli artisti");
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, studioId]);

  const handleInvite = async (artist: SearchArtistResult) => {
    if (!studioId || !user?.id) return;

    try {
      setInviting(artist.userId);
      const result = await inviteArtistToStudio({
        studioId,
        invitedUserId: artist.userId,
        invitedByUserId: user.id,
        role: "MEMBER",
      });

      if (result.success) {
        let id: any;
        id = toast.custom(
          <CustomToast
            message="Invito inviato"
            iconType="success"
            onClose={() => toast.dismiss(id)}
          />
        );
        setSearchQuery("");
        setSearchResults([]);
        await loadMembers(studioId);
      } else {
        toast.error(result.error || "Impossibile inviare l'invito");
      }
    } catch (error: any) {
      console.error("Error inviting artist:", error);
      toast.error(error.message || "Impossibile inviare l'invito");
    } finally {
      setInviting(null);
    }
  };

  const handleRemovePress = (member: StudioMember) => {
    setMemberToRemove(member);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!studioId || !user?.id || !memberToRemove) return;

    try {
      setRemoving(memberToRemove.id);
      setShowRemoveModal(false);

      const result = await removeStudioMember(
        studioId,
        memberToRemove.id,
        user.id
      );

      if (result.success) {
        toast.success("Membro rimosso");
        await loadMembers(studioId);
      } else {
        toast.error(result.error || "Impossibile rimuovere il membro");
      }
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error(error.message || "Impossibile rimuovere il membro");
    } finally {
      setRemoving(null);
      setMemberToRemove(null);
    }
  };

  const handleResend = async (invitationId: string) => {
    if (!user?.id) return;

    try {
      setResending(invitationId);
      const result = await resendInvitation(invitationId, user.id);

      if (result.success) {
        let id: any;
        id = toast.custom(
          <CustomToast
            message="Invito reinviato"
            iconType="success"
            onClose={() => toast.dismiss(id)}
          />
        );
      } else {
        toast.error(result.error || "Impossibile reinviare l'invito");
      }
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast.error(error.message || "Impossibile reinviare l'invito");
    } finally {
      setResending(null);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const showSearchError =
    searchQuery.trim().length >= 2 && !searching && searchResults.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={{ flex: 1 }}
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
          <View className="flex-row items-center gap-2">
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueSemibold"
            >
              Artisiti Collegati
            </ScaledText>
            <SVGIcons.DimondRed width={s(18)} height={s(18)} />
          </View>
        </View>

        {/* Divider */}
        <View
          className="bg-gray"
          style={{ height: s(1), marginBottom: mvs(32) }}
        />

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
          }}
        >
          {/* Helper text */}
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground font-neueLight"
            style={{ marginBottom: mvs(8) }}
          >
            In questa sezione puoi collegare altri artisti nella pagina del tuo
            studio.
          </ScaledText>

          {/* Search Bar */}
          <StudioSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showError={showSearchError}
            errorMessage="L'artista che stai provando a collegare non è presente su Tattoola. Controlla di aver inserito correttamente la sua email o il suo username e prova a cercarlo di nuovo. Ricorda che per essere collegato nella tua pagina l'artista deve avere un proprio profilo registrato su Tattoola."
          />

          {/* Search Results */}
          {searching ? (
            <View
              className="items-center justify-center"
              style={{ paddingVertical: mvs(24) }}
            >
              <View className="items-center justify-center animate-spin">
                <SVGIcons.LoadingGray
                  width={s(24)}
                  height={s(24)}
                  className=""
                />
              </View>
            </View>
          ) : searchResults.length > 0 ? (
            <>
              {searchResults.map((r) => (
                <ArtistSearchResultCard
                  key={r.userId}
                  item={r}
                  isInviting={inviting === r.userId}
                  onInvite={handleInvite}
                />
              ))}
              {/* Divider between search results and members */}
              <View
                style={{
                  height: s(1),
                  backgroundColor: "#A49A99",
                  marginVertical: mvs(16),
                }}
              />
            </>
          ) : null}

          {/* Loading Skeleton or Members */}
          {loading ? (
            <>
              <StudioArtistCardSkeleton />
              <StudioArtistCardSkeleton />
              <StudioArtistCardSkeleton />
            </>
          ) : (
            <>
              {/* Members (pending first then accepted) */}
              {members.pending.map((m) => (
                <StudioMemberCard
                  key={`p-${m.id}`}
                  item={m}
                  isRemoving={removing === m.id}
                  isResending={resending === m.id}
                  onRemove={handleRemovePress}
                  onResend={handleResend}
                />
              ))}
              {members.accepted.map((m) => (
                <StudioMemberCard
                  key={`a-${m.id}`}
                  item={m}
                  isRemoving={removing === m.id}
                  isResending={resending === m.id}
                  onRemove={handleRemovePress}
                  onResend={handleResend}
                />
              ))}

              {members.pending.length === 0 &&
                members.accepted.length === 0 && (
                  <View style={{ alignItems: "center", marginTop: mvs(24) }}>
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-montserratRegular"
                    >
                      Nessun artista collegato
                    </ScaledText>
                  </View>
                )}
            </>
          )}
        </ScrollView>

        {/* Remove Confirmation Modal */}
        <Modal
          visible={showRemoveModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRemoveModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center">
            <View
              className="bg-foreground rounded-2xl"
              style={{
                width: "85%",
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
                Rimuovere l'artista?
              </ScaledText>

              {/* Subtitle */}
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-background font-montserratMedium text-center"
                style={{ marginBottom: mvs(32) }}
              >
                Sei sicuro di voler rimuovere questo artista dalla pagina
                studio?
              </ScaledText>

              {/* Action Buttons */}
              <View style={{ gap: mvs(4) }} className="flex-row justify-center">
                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={() => setShowRemoveModal(false)}
                  className="rounded-full border-error items-center justify-center flex-row"
                  style={{
                    paddingVertical: mvs(8),
                    paddingLeft: s(18),
                    paddingRight: s(20),
                    gap: s(8),
                    borderWidth: s(0.5),
                  }}
                >
                  <SVGIcons.CloseRed style={{ width: s(14), height: s(14) }} />
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="font-montserratMedium text-error"
                  >
                    Annulla
                  </ScaledText>
                </TouchableOpacity>

                {/* Confirm Remove Button */}
                <TouchableOpacity
                  onPress={handleConfirmRemove}
                  className="rounded-full items-center justify-center"
                  style={{
                    paddingVertical: mvs(8),
                    paddingLeft: s(18),
                    paddingRight: s(20),
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-gray font-montserratMedium"
                  >
                    Rimuovi
                  </ScaledText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}
