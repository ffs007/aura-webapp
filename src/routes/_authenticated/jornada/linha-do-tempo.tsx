import { createFileRoute } from '@tanstack/react-router';
import { journeyHead } from '@/lib/journey';
import { journeyQuery, JourneyNav, Timeline } from '@/components/journey/JourneyWorkspace';
export const Route = createFileRoute('/_authenticated/jornada/linha-do-tempo')({ head: () => journeyHead('Linha do tempo'), loader: ({ context }) => context.queryClient.ensureQueryData(journeyQuery), component: Page });
function Page(){return <><JourneyNav/><Timeline/></>;}
