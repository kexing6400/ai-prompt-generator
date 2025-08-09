import { getSeoOptimizedMetadata } from "../../lib/metadata/seo-optimized-metadata"

export const metadata = getSeoOptimizedMetadata('ai-prompts-for-lawyers')

export default function LawyersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}