import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { tattooHead } from '@/lib/tattoo';
import { TattooGenerate } from '@/components/tattoo/TattooWorkspace';
export const Route=createFileRoute('/_authenticated/tatuagem/gerar')({validateSearch:z.object({projeto:z.string().uuid().optional()}),head:()=>tattooHead('Explorar conceitos'),component:Page});
function Page(){return <TattooGenerate projectId={Route.useSearch().projeto}/>;}
