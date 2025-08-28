import type { FC, MouseEventHandler, PropsWithChildren } from "react"
import { Transition } from "@headlessui/react"

export type FadeInOutProps = PropsWithChildren<{
  show: boolean
  className?: string
  appear?: boolean
  onClick?: MouseEventHandler<HTMLDivElement>
  as?: React.ElementType
}>

export const FadeInOut: FC<FadeInOutProps> = ({ ...p }) => {
  return (
    <Transition
      as={p.as}
      appear={p.appear}
      className={p.className}
      show={p.show}
      onClick={p.onClick}
      enter="transition-opacity duration-150"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      {p.children}
    </Transition>
  )
}
