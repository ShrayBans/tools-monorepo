import { ReactMarkdown } from "react-markdown/lib/react-markdown"
import { cn } from "../.."
import { memo } from "react"

interface StyledReactMarkdownProps {
  children: string
  className?: string
  // @ts-ignore
  components?: ReactMarkdownProps["components"]
}

const StyledReactMarkdown: React.FC<StyledReactMarkdownProps> = memo(({ children, className, components }) => {
  return (
    <ReactMarkdown
      className={cn("whitespace-pre-wrap flex flex-col gap-0", className)}
      components={{
        h1: ({ children }) => <h1 className="text-3xl font-bold mb-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-2xl font-semibold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xl font-medium mb-1">{children}</h3>,
        p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 pl-6 space-y-0 my-0 py-0 flex flex-col gap-0">{children}</ul>,
        ol: ({ children, start }) => (
          <ol
            className="my-0 py-0 pl-6 flex list-decimal flex-col gap-0 [&>li]:mt-0"
            // style={{ counterReset: `list-item ${(start || 1) - 1}` }}
          >
            {start} {children}
          </ol>
        ),
        li: ({ children, ...args }) => (
          <li className="leading-5 p-0 m-0">
            <div className="py-0.5">{children}</div>
          </li>
        ),
        a: ({ children, href }) => (
          <a href={href} className="font-semibold underline">
            {children}
          </a>
        ),
        ...components,
      }}
    >
      {children}
    </ReactMarkdown>
  )
})

StyledReactMarkdown.displayName = "StyledReactMarkdown"

export default StyledReactMarkdown
