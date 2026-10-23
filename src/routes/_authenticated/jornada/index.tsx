import { createFileRoute } from '@tanstack/react-router';
import { journeyHead } from '@/lib/journey';
import { journeyQuery, JourneyNav, JourneyHome } from '@/components/journey/JourneyWorkspace';
export const Route = createFileRoute('/_authenticated/jornada/')({ head: () => journeyHead('Seus planos'), loader: ({ context }) => context.queryClient.ensureQueryData(journeyQuery), component: Page });
function Page(){return <><JourneyNav/><JourneyHome/></>;}
