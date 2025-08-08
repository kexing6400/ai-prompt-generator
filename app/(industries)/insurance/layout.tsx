import { Metadata } from 'next'
import { getIndustryMetadata } from '@/lib/metadata/industry-metadata'

export const metadata: Metadata = getIndustryMetadata('insurance')

export default function InsuranceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}