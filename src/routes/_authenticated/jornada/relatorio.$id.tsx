import { createFileRoute } from '@tanstack/react-router';
import { journeyHead } from '@/lib/journey';
import { journeyQuery, JourneyNav, ReportView } from '@/components/journey/JourneyWorkspace';
export const Route = createFileRoute('/_authenticated/jornada/relatorio/$id')({ head: () => journeyHead('Relatório'), loader: ({ context }) => context.queryClient.ensureQueryData(journeyQuery), component: Page });
function Page(){const {id}=Route.useParams();return <><JourneyNav/><ReportView id={id}/></>;}
