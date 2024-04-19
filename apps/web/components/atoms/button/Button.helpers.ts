import { Theme } from "@/providers/theme/ThemeContext";

import { ButtonType } from "./Button";

import clsx from "clsx";
import classes from './Button.module.scss'

export const getButtonStyles = (variant: ButtonType, theme: Theme) => {
  let styles
  switch(variant) {
    case 'primary':
      styles = theme === Theme.LIGHT ? clsx(classes.button, classes.lightPrimaryButton) : clsx(classes.button, classes.darkPrimaryButton)
      break
    case 'secondary':
      styles = theme === Theme.LIGHT ? clsx(classes.button, classes.lightSecondaryButton) : clsx(classes.button, classes.darkSecondaryButton)
      break
  }

  return styles
}