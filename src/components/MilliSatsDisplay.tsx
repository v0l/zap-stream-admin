import React from "react";
import { Box, Typography } from "@mui/material";

interface MilliSatsDisplayProps {
  /** Amount in milli-satoshis */
  milliSats: number;
  /** Color for the main amount. Defaults to 'inherit' */
  color?: string;
  /** Typography variant for the main amount. Defaults to 'body2' */
  variant?: "body1" | "body2" | "h4" | "h6" | "subtitle2";
  /** Show only whole sats (no decimal part). Defaults to false */
  wholeSatsOnly?: boolean;
  /** Always show sign (+/-). Defaults to false */
  showSign?: boolean;
}

/**
 * Component to display milli-satoshi amounts with the decimal portion
 * shown in a smaller, grayed out font for better readability.
 */
export const MilliSatsDisplay: React.FC<MilliSatsDisplayProps> = ({
  milliSats,
  color = "inherit",
  variant = "body2",
  wholeSatsOnly = false,
  showSign = false,
}) => {
  // Convert milli-sats to sats
  const sats = milliSats / 1000;

  // Determine sign
  const sign = showSign ? (sats >= 0 ? "+" : "-") : "";

  // Format whole sats (round to nearest whole sat)
  const wholeSats = Math.round(Math.abs(sats));
  const formattedWhole = wholeSats.toLocaleString();

  if (wholeSatsOnly) {
    return (
      <Box component="span" display="inline-flex" alignItems="baseline">
        <Typography component="span" variant={variant} color={color}>
          {sign}
          {formattedWhole}
        </Typography>
        <Typography
          component="span"
          variant={variant}
          color={color}
          sx={{ ml: 0.5 }}
        >
          sats
        </Typography>
      </Box>
    );
  }

  // Convert milli-sats to sats with 3 decimal places for original behavior
  const satsString = sats.toFixed(3);

  // Split into whole and decimal parts
  const [wholePart, decimalPart] = satsString.split(".");

  return (
    <Box component="span" display="inline-flex" alignItems="baseline">
      <Typography component="span" variant={variant} color={color}>
        {sign}
        {parseInt(wholePart).toLocaleString()}
      </Typography>
      <Typography
        component="span"
        variant={variant}
        color="text.secondary"
        sx={{
          fontSize: "0.85em",
          opacity: 0.7,
        }}
      >
        .{decimalPart}
      </Typography>
      <Typography
        component="span"
        variant={variant}
        color={color}
        sx={{ ml: 0.5 }}
      >
        sats
      </Typography>
    </Box>
  );
};
