import { redirect } from 'next/navigation'

export default function SRSSetupPage() {
  redirect('/dashboard?srs_setup=true')
}
