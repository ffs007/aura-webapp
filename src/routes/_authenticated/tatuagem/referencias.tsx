import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { tattooHead } from '@/lib/tattoo';
import { TattooPhotos } from '@/components/tattoo/TattooPhotos';
export const Route=createFileRoute('/_authenticated/tatuagem/referencias')({validateSearch:z.object({projeto:z.string().uuid().optional()}),head:()=>tattooHead('Referências privadas'),component:Page});
function Page(){return <TattooPhotos projectId={Route.useSearch().projeto} userId={Route.useRouteContext().user.id}/>;}
