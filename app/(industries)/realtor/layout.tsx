import { Metadata } from 'next'
import { getIndustryMetadata } from '@/lib/metadata/industry-metadata'

export const metadata: Metadata = getIndustryMetadata('realtor')

export default function RealtorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}