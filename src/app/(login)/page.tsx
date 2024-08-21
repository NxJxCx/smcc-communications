import { type Metadata } from "next";
import MainComponent from "./_components/main";

export const metadata: Metadata = {
  title: "Home",
}

export default function MainPage() {
  return <MainComponent />
}