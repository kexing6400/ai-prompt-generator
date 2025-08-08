import { Metadata } from 'next'
import { getIndustryMetadata } from '@/lib/metadata/industry-metadata'

export const metadata: Metadata = getIndustryMetadata('lawyer')

export default function LawyerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}