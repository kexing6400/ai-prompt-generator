import { Metadata } from 'next'
import { getIndustryMetadata } from '@/lib/metadata/industry-metadata'

export const metadata: Metadata = getIndustryMetadata('teacher')

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}