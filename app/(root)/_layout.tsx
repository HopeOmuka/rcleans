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
      <Stack.Screen
        name="rate-service"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="pay-service"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chat/[serviceId]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="cleaner/[cleanerId]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default Layout;
