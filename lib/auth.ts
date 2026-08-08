import type { StartOAuthFlowParams, StartOAuthFlowReturnType } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { ApiResponse, fetchAPI } from "@/lib/fetch";

type GetAuthToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

export const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
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

type StartOAuthFlowFn = (
  params?: StartOAuthFlowParams,
) => Promise<StartOAuthFlowReturnType>;

interface OAuthError {
  code?: string;
  errors?: { longMessage?: string }[];
}

interface OAuthResult {
  success: boolean;
  code?: string;
  message?: string;
}

export const googleOAuth = async (
  startOAuthFlow: StartOAuthFlowFn,
  getToken: GetAuthToken,
): Promise<OAuthResult> => {
  try {
    const { createdSessionId, setActive, signUp } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/(root)/(tabs)/home"),
    });

    if (createdSessionId) {
      if (setActive) {
        await setActive({ session: createdSessionId });

        if (signUp?.createdUserId) {
          const token = await getToken({ skipCache: true });
          await fetchAPI<ApiResponse<{ id: string }>>("/(api)/user", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
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
