import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { monitoring } from "@/lib/sentry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
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

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center p-6 bg-white">
          <Text className="text-xl font-JakartaBold text-gray-800 mb-2">
            Something went wrong
          </Text>
          <Text className="text-base font-JakartaMedium text-gray-500 text-center mb-6">
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            className="bg-accent-500 px-8 py-3 rounded-full"
          >
            <Text className="text-white font-JakartaBold text-base">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
