import { Service } from "@/types/type";

export const sortServices = (services: Service[]): Service[] => {
  const result = services.sort((a, b) => {
    const dateA = new Date(`${a.created_at}T${a.service_time}`);
    const dateB = new Date(`${b.created_at}T${b.service_time}`);
    return dateB.getTime() - dateA.getTime();
  });

  return result.reverse();
};

export function formatTime(minutes: number): string {
  if (!minutes || typeof minutes !== "number") return "0 min";

  const mins = Math.round(minutes);

  if (mins < 60) {
    return `${mins} min`;
  } else {
    const hours = Math.floor(mins / 60);
    const remainingMinutes = mins % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day < 10 ? "0" + day : day} ${month} ${year}`;
}
