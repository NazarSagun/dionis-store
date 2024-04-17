import { Theme } from "@/providers/theme/ThemeContext";

import { ButtonType } from "./Button";

import clsx from "clsx";
import classes from './Button.module.scss'

export const getButtonStyles = (variant: ButtonType, theme: Theme) => {
  let styles
  switch(variant) {
    case 'primary':
      styles = theme === Theme.LIGHT ? clsx(classes.lightPrimaryButton) : clsx(classes.darkPrimaryButton)
      break
    case 'secondary':
      styles = theme === Theme.LIGHT ? clsx(classes.lightSecondaryButton) : clsx(classes.darkSecondaryButton)
      break
  }

  return styles
}