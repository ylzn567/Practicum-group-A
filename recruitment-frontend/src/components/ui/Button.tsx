import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  block?: boolean;
};

export function Button({
  variant = "primary",
  block = false,
  className = "",
  ...rest
}: ButtonProps) {
  const classes = [
    "ui-button",
    `ui-button--${variant}`,
    block ? "ui-button--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...rest} />;
}
