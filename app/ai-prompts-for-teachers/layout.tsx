import { getSeoOptimizedMetadata } from '@/lib/metadata/seo-optimized-metadata'

export const metadata = getSeoOptimizedMetadata('ai-prompts-for-teachers')

export default function TeachersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}