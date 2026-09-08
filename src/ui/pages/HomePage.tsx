import { MethodNote } from "../components/MethodNote";
import { HomeBackground } from "./HomeBackground";

export interface HomePageProps {
  onOpen: () => void;
  leaving: boolean;
}

// The landing page. Nothing here but the name, one line and the way in: no
// metrics, no navigation, no controls.
export function HomePage(props: HomePageProps) {
  let className = "home";
  if (props.leaving) {
    className = "home is-leaving";
  }

  return (
    <div className={className}>
      <HomeBackground />
      <div className="home-inner">
        <h1 className="home-title">Allocate</h1>
        <p className="home-sub">
          A decision simulation for kidney allocation policy.
        </p>
        <button type="button" className="home-button" onClick={props.onOpen}>
          Open the simulator
        </button>
        <MethodNote />
      </div>
    </div>
  );
}
