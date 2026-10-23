import { createFileRoute } from '@tanstack/react-router';
import { journeyHead } from '@/lib/journey';
import { journeyQuery, JourneyNav, GoalAndPlan } from '@/components/journey/JourneyWorkspace';
export const Route = createFileRoute('/_authenticated/jornada/objetivo')({ head: () => journeyHead('Objetivo e plano'), loader: ({ context }) => context.queryClient.ensureQueryData(journeyQuery), component: Page });
function Page(){return <><JourneyNav/><GoalAndPlan/></>;}
