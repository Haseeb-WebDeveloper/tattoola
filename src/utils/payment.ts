// Helper function to get status display info
export const getInvoiceStatusInfo = (status: string) => {
  switch (status) {
    case "PAID":
      return {
        label: "Paid",
        bgColor: "#11B95C66",
        textColor: "#11B95C",
      };
    case "OPEN":
      return {
        label: "Pending",
        bgColor: "#F7941066",
        textColor: "#F79410",
      };
    case "UNCOLLECTIBLE":
      return {
        label: "Failed",
        bgColor: "#FF4C4C33",
        textColor: "#FF4C4C",
      };
    case "VOID":
      return {
        label: "Void",
        bgColor: "#A49A9966",
        textColor: "#A49A99",
      };
    case "DRAFT":
      return {
        label: "Pending",
        bgColor: "#F49E0033",
        textColor: "#F49E00",
      };
    default:
      return {
        label: status,
        bgColor: "#A49A9966",
        textColor: "#A49A99",
      };
  }
};






  // Helper function to format currency
  export const formatCurrencyForInvoice = (amount: number, currency: string): string => {
    const currencySymbols: { [key: string]: string } = {
      EUR: "€",
      GBP: "£",
      USD: "$",
      JPY: "¥",
      CNY: "¥",
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(0)}`;
  };

  // Helper function to get plan name from invoice
  export const getPlanNameFromInvoice = (invoice: any): string => {
    // Try to get plan name from subscription
    if (
      invoice.user_subscriptions &&
      invoice.user_subscriptions.subscription_plans
    ) {
      return (
        invoice.user_subscriptions.subscription_plans.name || "Unknown Plan"
      );
    }
    // Fallback: try invoice items (in case planId is set in future)
    if (invoice.invoice_items && invoice.invoice_items.length > 0) {
      const firstItem = invoice.invoice_items[0];
      // Check for subscription_plans relation (from Supabase query)
      if (firstItem.subscription_plans) {
        return firstItem.subscription_plans.name || "Unknown Plan";
      }
      // Also check for plan in case the relation name differs
      if (firstItem.plan) {
        return firstItem.plan.name || "Unknown Plan";
      }
    }
    return "Unknown Plan";
  };