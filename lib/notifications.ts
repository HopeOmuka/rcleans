import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return true;
};

export const getPushToken = async (): Promise<string> => {
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
};

export const scheduleNotification = async (
  title: string,
  body: string,
  secondsFromNow: number = 1,
) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
    },
  });
};

export const sendPushNotification = async (
  _expoPushToken: string,
  title: string,
  body: string,
) => {
  await scheduleNotification(title, body);
};

export const NOTIFICATION_TYPES = {
  SERVICE_REQUEST: "service_request",
  SERVICE_MATCHED: "service_matched",
  SERVICE_STARTED: "service_started",
  SERVICE_COMPLETED: "service_completed",
  PAYMENT_RECEIVED: "payment_received",
  RATING_RECEIVED: "rating_received",
  SYSTEM_MESSAGE: "system_message",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

interface NotificationContent {
  title: string;
  body: string;
}

export const createNotificationContent = (
  type: NotificationType,
  data?: Record<string, unknown>,
): NotificationContent => {
  switch (type) {
    case NOTIFICATION_TYPES.SERVICE_REQUEST:
      return {
        title: "New Service Request",
        body: "You have a new cleaning service request!",
      };
    case NOTIFICATION_TYPES.SERVICE_MATCHED:
      return {
        title: "Service Matched",
        body: "A cleaner has been assigned to your service request.",
      };
    case NOTIFICATION_TYPES.SERVICE_STARTED:
      return {
        title: "Service Started",
        body: "Your cleaner has started the service.",
      };
    case NOTIFICATION_TYPES.SERVICE_COMPLETED:
      return {
        title: "Service Completed",
        body: "Your cleaning service has been completed successfully!",
      };
    case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
      return {
        title: "Payment Received",
        body: "Payment for your service has been processed.",
      };
    case NOTIFICATION_TYPES.RATING_RECEIVED:
      return {
        title: "New Rating",
        body: "You received a new rating from a customer.",
      };
    case NOTIFICATION_TYPES.SYSTEM_MESSAGE:
      return {
        title: (data?.title as string) || "RCleans",
        body: (data?.message as string) || "You have a new message.",
      };
    default:
      return {
        title: "RCleans",
        body: "You have a new notification.",
      };
  }
};
