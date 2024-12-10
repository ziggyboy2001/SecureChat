import { DefaultTheme, Theme } from "@react-navigation/native";

export interface Colors {
  primary: string;
  secondary: string;
  error: string;
  success: string;
  background: {
    primary: string,
    secondary: string,
    tertiary: string,
  };
  text: {
    primary: string,
    secondary: string,
    inverse: string,
    subtitle: string,
    colored: string,
  };
  border: {
    primary: string,
    secondary: string,
  };
  input: {
    background: string,
    border: string,
  };
  message: {
    own: string,
    other: string,
    time: string,
  };
  button: {
    primary: string,
    disabled: string,
    danger: string,
  };
}

export const colors = {
  primary: "#11d35f",
  secondary: "#666666",
  error: "#FF3B30",
  success: "#4CAF50",
  background: {
    primary: "#121212",
    secondary: "#282828",
    tertiary: "#1a1919",
  },
  text: {
    primary: "#ffffff",
    secondary: "#ffffff",
    inverse: "#FFFFFF",
    subtitle: "#8f9590",
    colored: "#11d35f",
  },
  border: {
    primary: "#E0E0E0",
    secondary: "#8f9590",
  },
  input: {
    background: "#121212",
    border: "#E0E0E0",
  },
  message: {
    own: "#11d35f",
    other: "#FFFFFF",
    time: "rgba(255, 255, 255, 0.7)",
  },
  button: {
    primary: "#11d35f",
    disabled: "#CCCCCC",
    danger: "#FF3B30",
  },
};

export const spacing = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 25,
  circle: 9999,
};

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: "bold",
  },
  h3: {
    fontSize: 20,
    fontWeight: "bold",
  },
  h4: {
    fontSize: 18,
    fontWeight: "bold",
  },
  body: {
    fontSize: 16,
  },
  bodySmall: {
    fontSize: 14,
  },
  caption: {
    fontSize: 12,
  },
};

export const shadows = {
  small: {
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
};

export const layout = {
  inputHeight: 50,
  avatarSizes: {
    small: 40,
    medium: 50,
    large: 80,
    xlarge: 100,
  },
};

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background.primary,
    card: colors.background.primary,
    text: colors.text.primary,
    border: colors.border.primary,
  },
};
