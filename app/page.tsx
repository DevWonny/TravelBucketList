import Image from "next/image";
import dynamic from "next/dynamic";

const Screen = dynamic(() => import("@/component/earth"));

export default function Home() {
  return (
    <div>
      <Screen />
    </div>
  );
}
