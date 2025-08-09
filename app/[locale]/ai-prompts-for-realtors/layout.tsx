import { getSeoOptimizedMetadata } from "../../../lib/metadata/seo-optimized-metadata"

export const metadata = getSeoOptimizedMetadata('ai-prompts-for-realtors')

export default function RealtorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}