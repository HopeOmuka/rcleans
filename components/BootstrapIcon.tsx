import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

import { BOOTSTRAP_ICONS, type BootstrapIconName } from "@/lib/bootstrap-icons";

export interface BootstrapIconProps {
  name: BootstrapIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export default function BootstrapIcon({
  name,
  size = 20,
  color = "#000000",
  style,
}: BootstrapIconProps) {
  const paths = BOOTSTRAP_ICONS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" style={style}>
      {paths.map((p, i) => (
        <Path key={i} d={p.d} fill={color} fillRule={p.fr ?? "nonzero"} />
      ))}
    </Svg>
  );
}
