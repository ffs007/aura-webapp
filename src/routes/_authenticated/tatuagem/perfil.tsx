import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { tattooHead } from '@/lib/tattoo';
import { TattooProfile } from '@/components/tattoo/TattooWorkspace';
export const Route=createFileRoute('/_authenticated/tatuagem/perfil')({validateSearch:z.object({projeto:z.string().uuid().optional()}),head:()=>tattooHead('Sua intenção'),component:Page});
function Page(){return <TattooProfile projectId={Route.useSearch().projeto}/>;}
