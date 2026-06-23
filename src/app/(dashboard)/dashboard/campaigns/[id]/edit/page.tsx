import CampaignEditClient from "./CampaignEditClient"

type Params = Promise<{ id: string }>

export default async function EditCampaignPage({ params }: { params: Params }) {
  const { id } = await params
  return <CampaignEditClient campaignId={id} />
}
