import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
} from "react-native";
import { spacing } from "@/lib/theme";

type Props = ScrollViewProps & {
  /** Compensa header nativo (telas com barra de título do Stack). */
  keyboardVerticalOffset?: number;
};

export function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  style,
  keyboardVerticalOffset = Platform.OS === "ios" ? 64 : 0,
  keyboardShouldPersistTaps = "handled",
  ...rest
}: Props) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const bottomInset =
    keyboardHeight > 0 ? keyboardHeight + spacing.lg : spacing.xl;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        {...rest}
        style={[styles.flex, style]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
});
