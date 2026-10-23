import { createFileRoute } from '@tanstack/react-router';
import { journeyHead } from '@/lib/journey';
import { journeyQuery, JourneyNav, PlanView } from '@/components/journey/JourneyWorkspace';
export const Route = createFileRoute('/_authenticated/jornada/plano/$id')({ head: () => journeyHead('Plano'), loader: ({ context }) => context.queryClient.ensureQueryData(journeyQuery), component: Page });
function Page(){const {id}=Route.useParams();return <><JourneyNav/><PlanView id={id}/></>;}
