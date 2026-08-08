import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme";
import { monitoring } from "@/lib/sentry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ThemedErrorFallback({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      className="flex-1 items-center justify-center p-6"
      style={{ backgroundColor: theme.colors.background }}
    >
      <Text
        className="text-xl font-JakartaBold mb-2"
        style={{ color: theme.colors.text }}
      >
        Something went wrong
      </Text>
      <Text
        className="text-base font-JakartaMedium text-center mb-6"
        style={{ color: theme.colors.textMuted }}
      >
        {error?.message || "An unexpected error occurred"}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        className="px-8 py-3 rounded-full"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <Text
          className="font-JakartaBold text-base"
          style={{ color: theme.colors.primaryContrast }}
        >
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    monitoring.captureError(error, {
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ThemedErrorFallback
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
