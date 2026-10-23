import { createFileRoute } from '@tanstack/react-router';
import { journeyHead } from '@/lib/journey';
import { journeyQuery, JourneyNav, Reports } from '@/components/journey/JourneyWorkspace';
export const Route = createFileRoute('/_authenticated/jornada/relatorios')({ head: () => journeyHead('Relatórios'), loader: ({ context }) => context.queryClient.ensureQueryData(journeyQuery), component: Page });
function Page(){return <><JourneyNav/><Reports/></>;}
