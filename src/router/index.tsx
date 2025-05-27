import BinarySearchVisualizer from "@/algorithms/binary-search";
import DijkstraVisualizer from "@/algorithms/dijkstra";
import GraphVisualizer from "@/algorithms/graph";
import QuickSortVisualizer from "@/algorithms/quick-sort";
import Home from "@/components/home";
import { Routes as ReactRoutes, Route } from "react-router-dom";
export default function Routers() {
  return (
    <ReactRoutes>
      <Route path="/" element={<Home />} />
      <Route path="/quick-sort" element={<QuickSortVisualizer />} />
      <Route path="/binary-search" element={<BinarySearchVisualizer />} />
      <Route path="/graph" element={<GraphVisualizer />} />
      <Route path="/dijkstra" element={<DijkstraVisualizer />} />
      <Route path="*" element={<div>Not ound</div>} />
    </ReactRoutes>
  );
}
