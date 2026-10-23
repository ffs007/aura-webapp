import { createFileRoute } from '@tanstack/react-router';
import { journeyHead } from '@/lib/journey';
import { journeyQuery, JourneyNav, Diary } from '@/components/journey/JourneyWorkspace';
export const Route = createFileRoute('/_authenticated/jornada/diario')({ head: () => journeyHead('Diário visual'), loader: ({ context }) => context.queryClient.ensureQueryData(journeyQuery), component: Page });
function Page(){return <><JourneyNav/><Diary/></>;}
