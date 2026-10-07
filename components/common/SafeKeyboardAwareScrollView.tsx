import { useFocusEffect } from "expo-router";
import { forwardRef, useCallback, useState } from "react";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-aware-scroll-view";

/**
 * KeyboardAwareScrollView registers a *global* keyboardDidShow listener and
 * resolves whichever TextInput is focused app-wide. A screen kept mounted in
 * the stack (e.g. Login behind another screen, or while the comment sheet's
 * Modal input is focused) would then call UIManager.viewIsDescendantOf with a
 * tag that isn't in its tree — "Cannot find view with reactTag N". Only the
 * focused screen may react to keyboard events.
 */
const SafeKeyboardAwareScrollView = forwardRef<any, KeyboardAwareScrollViewProps>(
  ({ enableAutomaticScroll = true, ...rest }, ref) => {
    const [focused, setFocused] = useState(true);
    useFocusEffect(
      useCallback(() => {
        setFocused(true);
        return () => setFocused(false);
      }, []),
    );
    return (
      <KeyboardAwareScrollView
        ref={ref}
        {...rest}
        enableAutomaticScroll={enableAutomaticScroll && focused}
      />
    );
  },
);

export default SafeKeyboardAwareScrollView;
