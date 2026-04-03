import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="find-service" options={{ headerShown: false }} />
      <Stack.Screen
        name="confirm-service"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="book-service"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default Layout;
