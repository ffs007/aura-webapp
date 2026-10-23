import { createFileRoute } from '@tanstack/react-router';
import { journeyHead } from '@/lib/journey';
import { journeyQuery, JourneyNav, Gallery } from '@/components/journey/JourneyWorkspace';
export const Route = createFileRoute('/_authenticated/jornada/galeria')({ head: () => journeyHead('Antes e depois'), loader: ({ context }) => context.queryClient.ensureQueryData(journeyQuery), component: Page });
function Page(){return <><JourneyNav/><Gallery/></>;}
