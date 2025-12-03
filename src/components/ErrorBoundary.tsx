import { router } from "expo-router";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log error in development
    if (__DEV__) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    try {
      router.replace("/(auth)/welcome");
    } catch (e) {
      // If navigation fails, just reset the error state
      this.setState({ hasError: false });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="items-center justify-center flex-1 px-6 bg-background">
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text className="mb-4 text-2xl text-center text-foreground font-neueSemibold">
              Ops! Qualcosa è andato storto
            </Text>

            <Text className="mb-6 text-base text-center text-foreground/70">
              Ci dispiace per il disagio. Per favore riprova.
            </Text>

            {__DEV__ && this.state.error && (
              <View className="max-w-full p-4 mb-6 rounded-lg bg-foreground/10">
                <Text className="font-mono text-xs text-foreground">
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text className="mt-2 font-mono text-xs text-foreground/70">
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              onPress={this.handleReset}
              className="px-8 py-4 rounded-full bg-primary"
            >
              <Text className="text-base text-foreground font-neueSemibold">
                Vai alla Home
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
