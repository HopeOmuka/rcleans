import { useLocalSearchParams } from "expo-router";

import SupportThread from "@/components/SupportThread";

const AdminSupportTicket = () => {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  if (!ticketId) return null;
  return <SupportThread ticketId={ticketId} />;
};

export default AdminSupportTicket;
