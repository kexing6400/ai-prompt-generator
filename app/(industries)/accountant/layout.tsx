import { Metadata } from 'next'
import { getIndustryMetadata } from '@/lib/metadata/industry-metadata'

export const metadata: Metadata = getIndustryMetadata('accountant')

export default function AccountantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}