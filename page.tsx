import HomeScreen from '@/components/screens/HomeScreen'

const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID ?? 'demo-owner'

export default function Page() {
  return <HomeScreen ownerId={OWNER_ID} />
}
