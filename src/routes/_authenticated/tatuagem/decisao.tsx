import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { tattooHead } from '@/lib/tattoo';
import { TattooDecision } from '@/components/tattoo/TattooPlanView';
export const Route=createFileRoute('/_authenticated/tatuagem/decisao')({validateSearch:z.object({projeto:z.string().uuid().optional()}),head:()=>tattooHead('Antes de decidir'),component:Page});
function Page(){return <TattooDecision projectId={Route.useSearch().projeto}/>;}
