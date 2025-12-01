import InvoiceFilterModal from "@/components/billing/InvoiceFilterModal";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { BillingService } from "@/services/billing.service";
import {
  formatCurrencyForInvoice,
  getInvoiceStatusInfo,
  getPlanNameFromInvoice,
} from "@/utils/payment";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

type InvoiceStatusFilter = "ALL" | "PAID" | "OPEN" | "UNCOLLECTIBLE";

export default function SettingsBilling() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<
    InvoiceStatusFilter[]
  >(["ALL"]);

  const loadInvoices = async () => {
    try {
      const inv = await BillingService.getInvoices();
      setInvoices(inv);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load invoices");
    }
  };

  useEffect(() => {
    (async () => {
      await loadInvoices();
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  const openInvoice = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      toast.error("Could not open invoice file");
    }
  };

  // Filter invoices based on selected statuses
  const filteredInvoices = useMemo(() => {
    if (
      selectedStatuses.length === 0 ||
      (selectedStatuses.length === 1 && selectedStatuses[0] === "ALL")
    ) {
      return invoices;
    }

    return invoices.filter((inv) => {
      // Map database status to filter status
      const statusMap: Record<string, InvoiceStatusFilter> = {
        PAID: "PAID",
        OPEN: "OPEN",
        DRAFT: "OPEN", // Draft invoices are treated as pending
        UNCOLLECTIBLE: "UNCOLLECTIBLE",
        VOID: "OPEN", // Void invoices can be shown as pending
      };

      const filterStatus = statusMap[inv.status] || "OPEN";
      return selectedStatuses.includes(filterStatus);
    });
  }, [invoices, selectedStatuses]);

  const handleApplyFilters = (statuses: InvoiceStatusFilter[]) => {
    setSelectedStatuses(statuses);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="bg-background min-h-screen"
      style={{
        flex: 1,
      }}
    >
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between w-full "
          style={{
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full bg-foreground/20 items-center justify-center"
            style={{ width: s(34), height: s(34), padding: s(8) }}
          >
            <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
          </TouchableOpacity>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-white font-neueSemibold"
          >
            Fatturazione
          </ScaledText>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            className="rounded-full  items-end justify-center"
            style={{
              width: s(32),
              height: s(32),
            }}
          >
            <SVGIcons.Menu width={s(20)} height={s(20)} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
            marginTop: mvs(24),
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Invoices */}
          <View>
            {loading ? (
              <View style={{ gap: mvs(12) }}>
                {[...Array(4)].map((_, idx) => (
                  <View
                    key={`loading-invoice-skeleton-${idx}`}
                    className="flex-col bg-tat-foreground border-gray"
                    style={{
                      borderWidth: s(1),
                      borderRadius: s(14),
                      paddingHorizontal: s(16),
                      paddingVertical: mvs(12),
                      gap: mvs(16),
                      opacity: 0.55,
                    }}
                  >
                    {/* Top row: Plan name and validity date */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <ScaledText
                        allowScaling={false}
                        variant="md"
                        className="text-foreground font-neueLight"
                      >
                        ...
                      </ScaledText>
                      <ScaledText
                        allowScaling={false}
                        variant="body2"
                        className="text-gray font-neueLight"
                      >
                        ...
                      </ScaledText>
                    </View>

                    {/* Bottom row: Price, Status badge, and download icon */}
                    <View
                      className="flex-row items-center justify-between"
                      style={{
                        gap: s(8),
                      }}
                    >
                      <ScaledText
                        allowScaling={false}
                        variant="md"
                        className="font-neueBold text-success"
                      >
                        ...
                      </ScaledText>
                      <View
                        style={{
                          backgroundColor: "#242424",
                          borderRadius: s(6),
                          paddingVertical: mvs(2),
                          paddingHorizontal: s(12),
                        }}
                      >
                        <ScaledText
                          allowScaling={false}
                          variant="body2"
                          className="font-neueBold"
                          style={{ color: "#AAA" }}
                        >
                          ...
                        </ScaledText>
                      </View>
                      <View style={{ flex: 1 }} />
                      <View>
                        <SVGIcons.Download
                          width={s(16)}
                          height={s(16)}
                          opacity={0.5}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : filteredInvoices.length === 0 ? (
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="text-gray text-center font-neueLight"
              >
                No invoices found
              </ScaledText>
            ) : (
              <View style={{ gap: mvs(12) }}>
                {filteredInvoices.map((inv) => {
                  const planName = getPlanNameFromInvoice(inv);
                  const formattedTotal = formatCurrencyForInvoice(
                    inv.amountTotal / 100,
                    inv.currency
                  );
                  const statusInfo = getInvoiceStatusInfo(inv.status);

                  // Use paidAt date if available, otherwise use createdAt
                  const paidDate = inv?.paidAt
                    ? new Date(inv.paidAt)
                    : inv?.createdAt
                      ? new Date(inv.createdAt)
                      : undefined;
                  const formattedDate = paidDate
                    ? paidDate
                        .toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })
                        .replace(/20(\d{2})$/, "$1")
                    : null;

                  return (
                    <View
                      key={inv.id}
                      className="flex-col bg-tat-foreground border-gray"
                      style={{
                        borderWidth: s(1),
                        borderRadius: s(14),
                        paddingHorizontal: s(16),
                        paddingVertical: mvs(12),
                        gap: mvs(16),
                      }}
                    >
                      {/* Top row: Plan name and validity date */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <ScaledText
                          allowScaling={false}
                          variant="md"
                          className="text-foreground font-neueLight"
                        >
                          Piano {planName}
                        </ScaledText>
                        {!!formattedDate && (
                          <ScaledText
                            allowScaling={false}
                            variant="body2"
                            className="text-gray font-neueLight"
                          >
                            {inv.status === "PAID" ? "Paid on" : "Created on"}{" "}
                            {formattedDate}
                          </ScaledText>
                        )}
                      </View>

                      {/* Bottom row: Price, Status badge, and download icon */}
                      <View
                        className="flex-row items-center justify-between"
                        style={{
                          gap: s(8),
                        }}
                      >
                        <ScaledText
                          allowScaling={false}
                          variant="md"
                          className={`font-neueBold text-success`}
                        >
                          {formattedTotal}
                        </ScaledText>
                        <View
                          style={{
                            backgroundColor: statusInfo.bgColor,
                            borderRadius: s(6),
                            paddingVertical: mvs(2),
                            paddingHorizontal: s(12),
                          }}
                        >
                          <ScaledText
                            allowScaling={false}
                            variant="body2"
                            className="font-neueBold"
                            style={{ color: statusInfo.textColor }}
                          >
                            {statusInfo.label}
                          </ScaledText>
                        </View>
                        <View style={{ flex: 1 }} />
                        {inv.pdfUrl && (
                          <TouchableOpacity
                            onPress={() => openInvoice(inv.pdfUrl)}
                            hitSlop={8}
                          >
                            <SVGIcons.Download width={s(16)} height={s(16)} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Filter Modal */}
      <InvoiceFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedStatuses={selectedStatuses}
        onApply={handleApplyFilters}
      />
    </KeyboardAvoidingView>
  );
}
