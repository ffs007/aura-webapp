import { createFileRoute } from '@tanstack/react-router';
import { tattooHead } from '@/lib/tattoo';
import { TattooHome } from '@/components/tattoo/TattooWorkspace';
export const Route=createFileRoute('/_authenticated/tatuagem/')({head:()=>tattooHead('Projetos'),component:Page});
function Page(){return <TattooHome />;}
