import { getSeoOptimizedMetadata } from "../../lib/metadata/seo-optimized-metadata"

export const metadata = getSeoOptimizedMetadata('ai-prompts-for-insurance-advisors')

export default function InsuranceAdvisorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}