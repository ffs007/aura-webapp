import { createFileRoute } from '@tanstack/react-router';
import { tattooHead } from '@/lib/tattoo';
import { TattooPlanView } from '@/components/tattoo/TattooPlanView';
export const Route=createFileRoute('/_authenticated/tatuagem/plano/$id')({head:()=>tattooHead('Seu conceito'),component:Page});
function Page(){return <TattooPlanView id={Route.useParams().id} userId={Route.useRouteContext().user.id}/>;}
