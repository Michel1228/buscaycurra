import dynamic from "next/dynamic";

const CurriculumContent = dynamic(() => import("./Content"), { ssr: false });

export default function CurriculumPage() {
  return <CurriculumContent />;
}
