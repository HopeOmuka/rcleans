import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";

import { fetchAPI } from "@/lib/fetch";

export const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log("No values stored under key: " + key);
      }
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export const googleOAuth = async (startOAuthFlow: any, getUser: () => any) => {
  try {
    const { createdSessionId, setActive, signUp } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/(root)/(tabs)/home"),
    });

    if (createdSessionId) {
      if (setActive) {
        await setActive({ session: createdSessionId });

        // Get user info from Clerk after sign in
        let userName = "Google User";
        let userEmail = "";

        if (getUser) {
          const user = getUser();
          userName =
            user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.fullName || "Google User";
          userEmail = user?.emailAddresses?.[0]?.emailAddress || "";
        }

        // Fallback to signUp data if getUser not available
        if (!userEmail && signUp.emailAddress) {
          userEmail = signUp.emailAddress;
        }
        if (userName === "Google User" && signUp.firstName) {
          userName = `${signUp.firstName} ${signUp.lastName || ""}`.trim();
        }

        if (signUp.createdUserId && userEmail) {
          try {
            await fetchAPI("/(api)/user", {
              method: "POST",
              body: JSON.stringify({
                name: userName,
                email: userEmail,
                clerkId: signUp.createdUserId,
              }),
            });
          } catch (userError) {
            console.error("Error creating user in database:", userError);
          }
        }

        return {
          success: true,
          code: "success",
          message: "You have successfully signed in with Google",
        };
      }
    }

    return {
      success: false,
      message: "An error occurred while signing in with Google",
    };
  } catch (err: any) {
    console.error(err);
    return {
      success: false,
      code: err.code,
      message: err?.errors[0]?.longMessage,
    };
  }
};
