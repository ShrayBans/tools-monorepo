// @ts-ignore
import { DynamicIcon as BaseDynamicIcon, DynamicIconProps as BaseDynamicIconProps } from "lucide-react/dynamic"
import { icons } from "lucide-react"
import { ComponentPropsWithoutRef } from "react"

type IconNames = keyof typeof icons

type KebabCase<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${First extends Capitalize<First> ? "-" : ""}${Lowercase<First>}${KebabCase<Rest>}`
  : ""

type FormatIconName<S extends string> = S extends `-${infer T}` ? T : S

type KebabIconNames = FormatIconName<KebabCase<IconNames>>

export type DynamicIconProps = Omit<ComponentPropsWithoutRef<typeof BaseDynamicIcon>, "name"> & { name: KebabIconNames }

export const DynamicIcon = ({ ...p }: DynamicIconProps) => {
  return <BaseDynamicIcon {...p} name={p.name as BaseDynamicIconProps["name"]} />
}
