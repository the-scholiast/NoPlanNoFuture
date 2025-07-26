import GymBreadcrumb from '@/components/gym/GymBreadcrumb'

export default function GymLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <GymBreadcrumb />
      {children}
    </div>
  )
}