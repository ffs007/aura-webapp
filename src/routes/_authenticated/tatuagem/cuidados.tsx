import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { tattooHead } from '@/lib/tattoo';
import { TattooCare } from '@/components/tattoo/TattooPlanView';
export const Route=createFileRoute('/_authenticated/tatuagem/cuidados')({validateSearch:z.object({projeto:z.string().uuid().optional()}),head:()=>tattooHead('Cuidados e diário'),component:Page});
function Page(){return <TattooCare projectId={Route.useSearch().projeto} userId={Route.useRouteContext().user.id}/>;}
