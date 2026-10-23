import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { tattooHead } from '@/lib/tattoo';
import { TattooBrief } from '@/components/tattoo/TattooPlanView';
export const Route=createFileRoute('/_authenticated/tatuagem/briefing')({validateSearch:z.object({versao:z.string().uuid().optional()}),head:()=>tattooHead('Briefing do tatuador'),component:Page});
function Page(){return <TattooBrief versionId={Route.useSearch().versao}/>;}
