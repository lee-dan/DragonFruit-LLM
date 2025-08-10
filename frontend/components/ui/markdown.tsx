import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { Components } from "react-markdown"

interface MarkdownProps {
  children: string
  className?: string
}

export function Markdown({ children, className = "" }: MarkdownProps) {
  const components: Components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "")
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark as any}
          language={match[1]}
          PreTag="div"
          className="rounded-md text-base"
          customStyle={{
            fontSize: '16px',
            lineHeight: '1.6',
            padding: '20px',
            margin: '16px 0'
          }}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} bg-muted px-1.5 py-0.5 rounded text-sm font-mono`} {...props}>
          {String(children).replace(/^`|`$/g, '')}
        </code>
      )
    },
    pre({ children, ...props }) {
      // Check if the pre contains a code element with syntax highlighting
      const hasSyntaxHighlighter = children && 
        typeof children === 'object' && 
        children !== null &&
        'type' in children && 
        children.type === 'div' && 
        'className' in children && 
        typeof children.className === 'string' &&
        children.className.includes('rounded-md');
      
      // If it has syntax highlighting, don't add additional styling
      if (hasSyntaxHighlighter) {
        return <>{children}</>
      }
      
      return (
        <pre className="bg-muted p-4 rounded-md overflow-x-auto" {...props}>
          {children}
        </pre>
      )
    },
    blockquote({ children, ...props }) {
      return (
        <blockquote className="border-l-4 border-primary pl-4 italic" {...props}>
          {children}
        </blockquote>
      )
    },
    table({ children, ...props }) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border" {...props}>
            {children}
          </table>
        </div>
      )
    },
    th({ children, ...props }) {
      return (
        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" {...props}>
          {children}
        </th>
      )
    },
    td({ children, ...props }) {
      return (
        <td className="px-6 py-4 whitespace-nowrap text-sm" {...props}>
          {children}
        </td>
      )
    }
  }

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
} 