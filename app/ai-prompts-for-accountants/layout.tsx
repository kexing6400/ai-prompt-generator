import { getSeoOptimizedMetadata } from "@/lib/metadata/seo-optimized-metadata"

export const metadata = getSeoOptimizedMetadata('ai-prompts-for-accountants')

export default function AccountantsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}