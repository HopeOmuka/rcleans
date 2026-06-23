import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { fetchAPI } from "@/lib/fetch";

export const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch {
      return;
    }
  },
};

interface OAuthFlowResult {
  createdSessionId?: string;
  setActive?: (session: { session: string }) => Promise<void>;
  signUp?: {
    createdUserId?: string;
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
  };
}

interface OAuthError {
  code?: string;
  errors?: Array<{ longMessage?: string }>;
}

interface OAuthResult {
  success: boolean;
  code?: string;
  message?: string;
}

export const googleOAuth = async (
  startOAuthFlow: (params: { redirectUrl: string }) => Promise<OAuthFlowResult>,
): Promise<OAuthResult> => {
  try {
    const { createdSessionId, setActive, signUp } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/(root)/(tabs)/home"),
    });

    if (createdSessionId) {
      if (setActive) {
        await setActive({ session: createdSessionId });

        if (signUp?.createdUserId) {
          await fetchAPI("/(api)/user", {
            method: "POST",
            body: JSON.stringify({
              name: `${signUp.firstName || ""} ${signUp.lastName || ""}`.trim(),
              email: signUp.emailAddress,
              clerkId: signUp.createdUserId,
            }),
          });
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
  } catch (err: unknown) {
    console.error(err);
    const oauthError = err as OAuthError;
    return {
      success: false,
      code: oauthError.code,
      message: oauthError.errors?.[0]?.longMessage,
    };
  }
};
