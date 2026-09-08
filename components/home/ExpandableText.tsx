import { memo, useState } from "react";
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, StyleProp } from "react-native";

type Props = {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  linkColor: string;
  numberOfLines?: number;
};

/** Clamps text to N lines with a Read More/Read Less toggle — only shown when the text actually overflows. */
function ExpandableText({ text, textStyle, linkColor, numberOfLines = 2 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  return (
    <View>
      {/* Hidden measuring pass — full layout, no clamp — to detect real overflow. */}
      <Text
        style={[textStyle, styles.hidden]}
        onTextLayout={(e) => {
          if (e.nativeEvent.lines.length > numberOfLines) setTruncated(true);
        }}
      >
        {text}
      </Text>
      <Text style={textStyle} numberOfLines={expanded ? undefined : numberOfLines}>
        {text}
      </Text>
      {truncated && (
        <TouchableOpacity onPress={() => setExpanded((v) => !v)} hitSlop={6}>
          <Text style={[styles.link, { color: linkColor }]}>
            {expanded ? "Read Less" : "Read More"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default memo(ExpandableText);

const styles = StyleSheet.create({
  hidden: { position: "absolute", opacity: 0, zIndex: -1 },
  link: { fontSize: 13, fontWeight: "600", marginTop: 4 },
});
